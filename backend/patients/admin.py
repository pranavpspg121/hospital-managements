from django.contrib import admin
from patients.models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'phone', 'blood_group', 'date_of_birth', 'created_at']
    list_filter = ['blood_group']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Patient Name'
