from django.contrib import admin
from reports.models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'report_type', 'uploaded_at']
    list_filter = ['report_type', 'uploaded_at']
    search_fields = ['patient__user__username', 'doctor__user__username', 'report_type']
