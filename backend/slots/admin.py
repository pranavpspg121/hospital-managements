from django.contrib import admin
from slots.models import Slot

@admin.register(Slot)
class SlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'day_of_week', 'start_time', 'end_time', 'max_patients', 'is_active']
    list_filter = ['day_of_week', 'is_active', 'doctor']
    search_fields = ['doctor__user__first_name', 'doctor__user__last_name']
