from rest_framework import serializers
from django.contrib.auth import get_user_model
from doctors.models import Doctor
from departments.serializers import DepartmentSerializer

User = get_user_model()

from authentication.serializers import UserMiniSerializer

class DoctorSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'user', 'department', 'department_details', 'specialization', 'qualification', 'experience', 'fee', 'photo', 'is_active', 'avail_days']

class DoctorCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['department', 'specialization', 'qualification', 'experience', 'fee', 'photo', 'is_active', 'avail_days']
