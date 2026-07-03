from rest_framework import serializers
from reports.models import Report
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
import os

class ReportSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'patient', 'patient_details', 'doctor', 'doctor_details', 'file', 'report_type', 'description', 'uploaded_at']

    def validate_file(self, value):
        # 1. Size restriction (Max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB.")

        # 2. Extension validation
        ext = os.path.splitext(value.name)[1].lower()
        valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
        if ext not in valid_extensions:
            raise serializers.ValidationError("Unsupported file format. Only PDF, JPG, JPEG, and PNG are allowed.")
            
        return value
