from django.db import models
from patients.models import Patient
from doctors.models import Doctor
from slots.models import Slot

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        CONFIRMED = 'Confirmed', 'Confirmed'
        IN_PROGRESS = 'In Progress', 'In Progress'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'
        NO_SHOW = 'No Show', 'No Show'

    class PaymentStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        PAID = 'Paid', 'Paid'
        FAILED = 'Failed', 'Failed'
        REFUNDED = 'Refunded', 'Refunded'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    slot = models.ForeignKey(Slot, on_delete=models.SET_NULL, null=True, related_name='appointments')
    appt_date = models.DateField()
    slot_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    symptoms = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Razorpay payment keys
    razorpay_ord_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_pay_id = models.CharField(max_length=100, blank=True, null=True)
    
    cancel_reason = models.TextField(blank=True, null=True)
    cancelled_by = models.CharField(max_length=20, blank=True, null=True) # "Patient", "Doctor", "Admin"
    
    rescheduled_from = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='rescheduled_to')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.appt_date} at {self.slot_time}"


class Prescription(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='prescription')
    diagnosis = models.TextField()
    notes = models.TextField(blank=True, null=True)
    medicines = models.JSONField(default=list) # List of dicts: {name, dosage, duration, instructions}
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.appointment.patient} by {self.appointment.doctor} on {self.created_at.date()}"
