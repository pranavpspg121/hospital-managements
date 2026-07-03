from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from patients.models import Patient
from doctors.models import Doctor
from authentication.models import Notification

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'phone', 'address', 'date_of_birth', 'blood_group', 'medical_history', 'emergency_no']

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'department', 'specialization', 'qualification', 'experience', 'fee', 'photo', 'avail_days']

class UserSerializer(serializers.ModelSerializer):
    patient_profile = serializers.SerializerMethodField()
    doctor_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile_photo', 'patient_profile', 'doctor_profile']

    def get_patient_profile(self, obj):
        if obj.role == User.Role.PATIENT and hasattr(obj, 'patient'):
            return PatientProfileSerializer(obj.patient).data
        return None

    def get_doctor_profile(self, obj):
        if obj.role == User.Role.DOCTOR and hasattr(obj, 'doctor'):
            return DoctorProfileSerializer(obj.doctor).data
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.PATIENT)
    phone = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']

    def validate(self, attrs):
        # Validate password format
        password = attrs.get('password')
        if not any(char.isupper() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})
        if not any(char.isdigit() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data.pop('phone', None)
        role = validated_data.get('role', User.Role.PATIENT)
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Automatically build corresponding Profile
        if role == User.Role.PATIENT:
            Patient.objects.create(user=user, phone=phone)
        elif role == User.Role.DOCTOR:
            Doctor.objects.create(user=user)

        # Welcome notification
        Notification.objects.create(
            user=user,
            type='Welcome',
            message=f"Welcome to MediCare, {user.first_name or user.username}! Your account has been registered successfully."
        )

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        if not any(char.isupper() for char in new_password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one uppercase letter."})
        if not any(char.isdigit() for char in new_password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one number."})
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'is_read', 'created_at']


from authentication.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'role', 'action', 'ip_address', 'timestamp']


from authentication.models import JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ['id', 'name', 'email', 'phone', 'position', 'qualification', 'resume', 'applied_at']


from authentication.models import ContactMessage

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'sent_at', 'is_read']
