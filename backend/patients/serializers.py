from rest_framework import serializers
from patients.models import Patient
from authentication.serializers import UserMiniSerializer

class PatientSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'user', 'phone', 'address', 'date_of_birth', 'blood_group', 'medical_history', 'emergency_no', 'created_at']

class PatientUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['phone', 'address', 'date_of_birth', 'blood_group', 'medical_history', 'emergency_no']
