from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date
from django.utils import timezone
from django.contrib.auth import get_user_model
from patients.models import Patient
from doctors.models import Doctor
from slots.models import Slot
from appointments.models import Appointment, Prescription
from appointments.serializers import AppointmentSerializer, AppointmentCreateSerializer, PrescriptionSerializer
from authentication.models import Notification
from authentication.views import log_action

class AppointmentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related(
            'patient__user', 'doctor__user', 'doctor__department', 'slot'
        ).all()

        # Role Filtering
        if user.role == 'PATIENT':
            queryset = queryset.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            queryset = queryset.filter(doctor__user=user)
        # Admins see everything

        # Filtering by query params
        status_param = self.request.query_params.get('status')
        if status_param is not None:
            queryset = queryset.filter(status=status_param)

        date_param = self.request.query_params.get('date')
        if date_param is not None:
            queryset = queryset.filter(appt_date=date_param)

        return queryset.order_by('-appt_date', '-slot_time')

    def get_serializer_class(self):
        if self.action in ['create']:
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        appointment = serializer.save()
        # Trigger welcome/confirmation notifications
        Notification.objects.create(
            user=appointment.patient.user,
            type='Appointment',
            message=f"Your appointment with Dr. {appointment.doctor.user.get_full_name() or appointment.doctor.user.username} on {appointment.appt_date} at {appointment.slot_time} is pending confirmation."
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        """
        appointment = self.get_object()
        cancel_reason = request.data.get('cancel_reason', '')
        
        # Validation: check if already cancelled or completed
        if appointment.status in ['Completed', 'Cancelled']:
            return Response(
                {"error": f"Cannot cancel an appointment that is already {appointment.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Role-based restriction: Patient can only cancel if > 24 hours before appointment
        if request.user.role == 'PATIENT':
            appt_datetime = timezone.make_aware(
                timezone.datetime.combine(appointment.appt_date, appointment.slot_time)
            )
            time_difference = appt_datetime - timezone.now()
            if time_difference < timezone.timedelta(hours=24):
                return Response(
                    {"error": "Cancellations must be made at least 24 hours in advance."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            appointment.cancelled_by = "Patient"
        elif request.user.role == 'DOCTOR':
            appointment.cancelled_by = "Doctor"
        else:
            appointment.cancelled_by = "Admin"

        appointment.status = Appointment.Status.CANCELLED
        appointment.cancel_reason = cancel_reason
        appointment.save()

        # In-app notifications
        Notification.objects.create(
            user=appointment.patient.user,
            type='Appointment',
            message=f"Your appointment with Dr. {appointment.doctor.user.get_full_name()} on {appointment.appt_date} has been cancelled."
        )

        return Response({"status": "Appointment cancelled successfully."})

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an appointment.
        """
        appointment = self.get_object()
        new_date_str = request.data.get('appt_date')
        new_slot_id = request.data.get('slot')
        new_time_str = request.data.get('slot_time')

        if not new_date_str or not new_slot_id or not new_time_str:
            return Response(
                {"error": "Please provide 'appt_date', 'slot' ID, and 'slot_time'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment.status in ['Completed', 'Cancelled']:
            return Response(
                {"error": "Cannot reschedule completed or cancelled appointments."},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.appt_date = new_date_str
        appointment.slot_id = new_slot_id
        appointment.slot_time = new_time_str
        appointment.status = Appointment.Status.PENDING
        appointment.save()

        Notification.objects.create(
            user=appointment.patient.user,
            type='Appointment',
            message=f"Your appointment with Dr. {appointment.doctor.user.get_full_name()} has been rescheduled to {new_date_str} at {new_time_str}."
        )

        return Response({"status": "Appointment rescheduled successfully."})

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        List today's appointments.
        """
        today_date = date.today()
        queryset = self.get_queryset().filter(appt_date=today_date)
        serializer = AppointmentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        List upcoming appointments.
        """
        today_date = date.today()
        queryset = self.get_queryset().filter(appt_date__gte=today_date, status__in=['Pending', 'Confirmed'])
        serializer = AppointmentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        List past appointments.
        """
        today_date = date.today()
        queryset = self.get_queryset().filter(appt_date__lt=today_date) | self.get_queryset().filter(status__in=['Completed', 'Cancelled'])
        serializer = AppointmentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_prescription(self, request, pk=None):
        """
        Add prescription/EMR details to an appointment. Only for Doctors.
        """
        appointment = self.get_object()
        if request.user.role != 'DOCTOR' and request.user.role != 'ADMIN':
            return Response(
                {"error": "Only doctors can write prescriptions."},
                status=status.HTTP_403_FORBIDDEN
            )

        diagnosis = request.data.get('diagnosis')
        notes = request.data.get('notes', '')
        medicines = request.data.get('medicines', [])
        follow_up_date = request.data.get('follow_up_date')

        if not diagnosis:
            return Response(
                {"error": "Diagnosis is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prescription, created = Prescription.objects.get_or_create(appointment=appointment)
        prescription.diagnosis = diagnosis
        prescription.notes = notes
        prescription.medicines = medicines
        if follow_up_date:
            prescription.follow_up_date = follow_up_date
        prescription.save()

        # Update appointment status to Completed
        appointment.status = Appointment.Status.COMPLETED
        appointment.save()

        # Trigger notification
        Notification.objects.create(
            user=appointment.patient.user,
            type='Report',
            message=f"Prescription has been added to your appointment on {appointment.appt_date}."
        )

        return Response(PrescriptionSerializer(prescription).data)

    @action(detail=False, methods=['post'])
    def walkin(self, request):
        """
        Book and check-in a walk-in patient. Only for Receptionists and Admins.
        """
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {"error": "Only receptionists and admins can register walk-ins."},
                status=status.HTTP_403_FORBIDDEN
            )

        patient_email = request.data.get('patient_email')
        patient_name = request.data.get('patient_name')
        patient_phone = request.data.get('patient_phone')
        doctor_id = request.data.get('doctor')
        slot_id = request.data.get('slot')
        appt_date = request.data.get('appt_date')
        slot_time = request.data.get('slot_time')
        symptoms = request.data.get('symptoms', '')

        # Fetch or create User
        User = get_user_model()
        user_obj, created = User.objects.get_or_create(
            email=patient_email,
            defaults={
                'username': f"walkin_{timezone.now().timestamp()}",
                'first_name': patient_name.split(' ')[0] if patient_name else 'Walk-in',
                'last_name': ' '.join(patient_name.split(' ')[1:]) if patient_name and len(patient_name.split(' ')) > 1 else 'Patient',
                'role': 'PATIENT'
            }
        )
        if created:
            user_obj.set_password('WalkinPatient@123')
            user_obj.save()

        # Fetch or create Patient profile
        patient, _ = Patient.objects.get_or_create(
            user=user_obj,
            defaults={'phone': patient_phone}
        )

        doctor = Doctor.objects.get(id=doctor_id)
        slot = Slot.objects.get(id=slot_id)

        # Create Appointment
        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            slot=slot,
            appt_date=appt_date,
            slot_time=slot_time,
            symptoms=symptoms,
            amount=doctor.fee,
            status=Appointment.Status.CONFIRMED, # Confirmed immediately
            payment_status=Appointment.PaymentStatus.PAID
        )

        # Log Action
        log_action(request.user, f"Registered walk-in appointment #{appointment.id} for patient {patient_name}", request)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
