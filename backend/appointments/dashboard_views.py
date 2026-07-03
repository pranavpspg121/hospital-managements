from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, Sum
from datetime import date, timedelta
from patients.models import Patient
from doctors.models import Doctor
from appointments.models import Appointment
from billing.models import Payment
from departments.models import Department
from authentication.permissions import IsAdminUserRole

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        total_patients = Patient.objects.count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.count()
        
        # Total revenue is sum of successful payments
        revenue_data = Payment.objects.filter(status='Success').aggregate(total_revenue=Sum('amount'))
        total_revenue = revenue_data.get('total_revenue') or 0.00

        return Response({
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'total_revenue': float(total_revenue)
        }, status=status.HTTP_200_OK)

class AppointmentTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        # Last 30 days appointment count grouped by date
        today = date.today()
        start_date = today - timedelta(days=30)
        
        trends = Appointment.objects.filter(
            appt_date__gte=start_date,
            appt_date__lte=today
        ).values('appt_date').annotate(count=Count('id')).order_by('appt_date')
        
        # Populate missing dates with 0
        trends_dict = {item['appt_date']: item['count'] for item in trends}
        data = []
        for i in range(31):
            curr_date = start_date + timedelta(days=i)
            data.append({
                'date': curr_date.strftime('%Y-%m-%d'),
                'count': trends_dict.get(curr_date, 0)
            })

        return Response(data, status=status.HTTP_200_OK)

class RevenueAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        # Last 30 days revenue trends grouped by date
        today = date.today()
        start_date = today - timedelta(days=30)
        
        revenue_trends = Payment.objects.filter(
            status='Success',
            created_at__date__gte=start_date,
            created_at__date__lte=today
        ).values('created_at__date').annotate(revenue=Sum('amount')).order_by('created_at__date')
        
        trends_dict = {item['created_at__date']: item['revenue'] for item in revenue_trends}
        data = []
        for i in range(31):
            curr_date = start_date + timedelta(days=i)
            data.append({
                'date': curr_date.strftime('%Y-%m-%d'),
                'revenue': float(trends_dict.get(curr_date, 0.00))
            })

        return Response(data, status=status.HTTP_200_OK)

class DepartmentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        departments = Department.objects.annotate(
            doctor_count=Count('doctors', distinct=True),
            appointment_count=Count('doctors__appointments', distinct=True)
        )
        
        data = []
        for dept in departments:
            data.append({
                'name': dept.name,
                'doctors': dept.doctor_count,
                'appointments': dept.appointment_count
            })
            
        return Response(data, status=status.HTTP_200_OK)
