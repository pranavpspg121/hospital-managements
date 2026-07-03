from django.contrib import admin
from appointments.models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'doctor', 'appt_date', 'slot_time', 'status', 'payment_status', 'amount']
    list_filter = ['status', 'payment_status', 'appt_date', 'doctor']
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'doctor__user__first_name', 'doctor__user__last_name']
