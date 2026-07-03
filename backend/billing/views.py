from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
try:
    import razorpay
except Exception:
    razorpay = None
from django.conf import settings
from appointments.models import Appointment
from billing.models import Payment
from billing.serializers import PaymentSerializer
from authentication.models import Notification

def get_razorpay_client():
    """Return a fresh Razorpay client using current settings."""
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_mockkeyid')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'mocksecretkey')
    if razorpay is None:
        return None, key_id, key_secret
    try:
        c = razorpay.Client(auth=(key_id, key_secret))
        return c, key_id, key_secret
    except Exception:
        return None, key_id, key_secret

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response({"error": "Appointment ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id, patient__user=request.user)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        amount_in_paise = int(appointment.amount * 100)

        # Build order
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f"receipt_appt_{appointment.id}",
            'payment_capture': 1
        }

        # Get fresh client and credentials
        import time
        client, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET = get_razorpay_client()
        order_id = f"order_mock_{appointment.id}_{int(time.time())}" if 'mock' in RAZORPAY_KEY_ID else None

        if client and not order_id:
            try:
                razorpay_order = client.order.create(data=order_data)
                order_id = razorpay_order['id']
            except Exception as e:
                print("Razorpay SDK Order creation exception:", e)
                order_id = f"order_mock_{appointment.id}_{int(time.time())}"

        # If still None, generate mock ID
        if not order_id:
            order_id = f"order_mock_{appointment.id}_{int(time.time())}"

        appointment.razorpay_ord_id = order_id
        appointment.save()

        return Response({
            'order_id': order_id,
            'amount': appointment.amount,
            'currency': 'INR',
            'key_id': RAZORPAY_KEY_ID
        }, status=status.HTTP_200_OK)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        if not order_id or not payment_id or not signature:
            return Response({"error": "Order ID, Payment ID, and Signature are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(razorpay_ord_id=order_id)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment matching order not found."}, status=status.HTTP_404_NOT_FOUND)

        # Verify signature
        is_verified = False
        client, _, _ = get_razorpay_client()
        if 'mock' in order_id:
            is_verified = True  # Auto-verify mock orders
        elif client:
            try:
                params_dict = {
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                }
                client.utility.verify_payment_signature(params_dict)
                is_verified = True
            except Exception:
                is_verified = False

        if is_verified:
            # Update appointment
            appointment.payment_status = Appointment.PaymentStatus.PAID
            appointment.status = Appointment.Status.CONFIRMED
            appointment.razorpay_pay_id = payment_id
            appointment.save()

            # Create payment record
            Payment.objects.get_or_create(
                appointment=appointment,
                defaults={
                    'amount': appointment.amount,
                    'status': 'Success',
                    'method': 'Razorpay',
                    'transaction_id': payment_id
                }
            )

            # Notification
            Notification.objects.create(
                user=appointment.patient.user,
                type='Appointment',
                message=f"Payment of ₹{appointment.amount} verified. Your appointment with Dr. {appointment.doctor} is confirmed!"
            )

            return Response({"status": "Payment verified and appointment confirmed."}, status=status.HTTP_200_OK)
        else:
            appointment.payment_status = Appointment.PaymentStatus.FAILED
            appointment.save()
            return Response({"error": "Invalid signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

class DemoPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Demo payment confirmation bypasses external Razorpay flow.
        """
        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response({"error": "Appointment ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id, patient__user=request.user)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        import uuid
        transaction_id = f"demo_txn_{uuid.uuid4().hex[:12]}"
        
        appointment.payment_status = Appointment.PaymentStatus.PAID
        appointment.status = Appointment.Status.CONFIRMED
        appointment.razorpay_pay_id = transaction_id
        appointment.save()

        Payment.objects.get_or_create(
            appointment=appointment,
            defaults={
                'amount': appointment.amount,
                'status': 'Success',
                'method': 'Demo Checkout',
                'transaction_id': transaction_id
            }
        )

        Notification.objects.create(
            user=appointment.patient.user,
            type='Appointment',
            message=f"Demo payment of ₹{appointment.amount} completed. Appointment with Dr. {appointment.doctor} is confirmed!"
        )

        return Response({"status": "Demo payment success. Appointment confirmed."}, status=status.HTTP_200_OK)

class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Payment.objects.select_related('appointment__patient__user', 'appointment__doctor__user').all()
        elif user.role == 'PATIENT':
            return Payment.objects.select_related('appointment__patient__user', 'appointment__doctor__user').filter(appointment__patient__user=user)
        return Payment.objects.none()
