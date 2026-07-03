from django.db import models
from patients.models import Patient
from doctors.models import Doctor

class Report(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reports')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='reports')
    file = models.FileField(upload_to='reports/')
    report_type = models.CharField(max_length=100)  # e.g., 'Blood Test', 'X-Ray', 'Prescription'
    description = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.report_type} for {self.patient.user.username}"
