from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from authentication.serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer, NotificationSerializer
)
from authentication.models import Notification
from patients.models import Patient
from doctors.models import Doctor

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        import json
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Save user fields
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
        elif 'profile_photo' in request.data and not request.data['profile_photo']:
            user.profile_photo = None
        user.save()

        # Update nested profile data
        if user.role == User.Role.PATIENT and hasattr(user, 'patient'):
            profile_data = request.data.get('patient_profile', {})
            if isinstance(profile_data, str):
                try:
                    profile_data = json.loads(profile_data)
                except ValueError:
                    profile_data = {}
            patient = user.patient
            patient.phone = profile_data.get('phone', patient.phone)
            patient.address = profile_data.get('address', patient.address)
            patient.date_of_birth = profile_data.get('date_of_birth', patient.date_of_birth)
            patient.blood_group = profile_data.get('blood_group', patient.blood_group)
            patient.medical_history = profile_data.get('medical_history', patient.medical_history)
            patient.emergency_no = profile_data.get('emergency_no', patient.emergency_no)
            patient.save()
        elif user.role == User.Role.DOCTOR and hasattr(user, 'doctor'):
            profile_data = request.data.get('doctor_profile', {})
            if isinstance(profile_data, str):
                try:
                    profile_data = json.loads(profile_data)
                except ValueError:
                    profile_data = {}
            doctor = user.doctor
            doctor.specialization = profile_data.get('specialization', doctor.specialization)
            doctor.qualification = profile_data.get('qualification', doctor.qualification)
            try:
                doctor.experience = int(profile_data.get('experience', doctor.experience))
            except (ValueError, TypeError):
                pass
            try:
                doctor.fee = float(profile_data.get('fee', doctor.fee))
            except (ValueError, TypeError):
                pass
            doctor.avail_days = profile_data.get('avail_days', doctor.avail_days)
            doctor.save()

        log_action(user, "Updated profile details", request)
        return Response(self.get_serializer(user).data)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        log_action(user, "Changed password", request)
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    # Custom action to mark all notifications as read
    def create(self, request, *args, **kwargs):
        Notification.objects.filter(user=self.request.user).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({"detail": "All notifications cleared."}, status=status.HTTP_204_NO_CONTENT)


from authentication.models import AuditLog
from authentication.serializers import AuditLogSerializer
from authentication.permissions import IsAdminUserRole

def log_action(user, action, request=None):
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(user=user, action=action, ip_address=ip_address)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]


from authentication.models import JobApplication
from authentication.serializers import JobApplicationSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all().order_by('-applied_at')
    serializer_class = JobApplicationSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUserRole()]


from authentication.models import ContactMessage
from authentication.serializers import ContactMessageSerializer

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-sent_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminUserRole()]
