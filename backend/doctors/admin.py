from django.contrib import admin
from doctors.models import Doctor

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'department', 'specialization', 'experience', 'fee', 'is_active']
    list_filter = ['department', 'specialization', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'specialization']

    def get_name(self, obj):
        return f"Dr. {obj.user.get_full_name() or obj.user.username}"
    get_name.short_description = 'Doctor Name'
