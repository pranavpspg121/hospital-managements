from rest_framework import serializers
from departments.models import Department, HospitalSetting

class DepartmentSerializer(serializers.ModelSerializer):
    doctor_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active', 'doctor_count', 'created_at', 'updated_at']

class HospitalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalSetting
        fields = ['id', 'address', 'phone', 'email']
