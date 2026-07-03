from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import views from all apps
from authentication.views import (
    RegisterView, ProfileView, ChangePasswordView, LogoutView, NotificationViewSet, AuditLogViewSet, JobApplicationViewSet, ContactMessageViewSet
)
from departments.views import DepartmentViewSet, HospitalSettingView
from doctors.views import DoctorViewSet
from patients.views import PatientViewSet
from slots.views import SlotViewSet
from appointments.views import AppointmentViewSet
from reports.views import ReportViewSet
from billing.views import (
    CreateOrderView, VerifyPaymentView, DemoPaymentView, PaymentHistoryViewSet
)
from appointments.dashboard_views import (
    DashboardSummaryView, AppointmentTrendsView, RevenueAnalyticsView, DepartmentStatsView
)

# REST API Router
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'slots', SlotViewSet, basename='slot')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'billing/history', PaymentHistoryViewSet, basename='payment-history')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'job-applications', JobApplicationViewSet, basename='job-application')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-message')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Authentication Endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', ProfileView.as_view(), name='auth_profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    
    # Payment Endpoints
    path('api/billing/create-order/', CreateOrderView.as_view(), name='create_order'),
    path('api/billing/verify-payment/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('api/billing/demo-payment/', DemoPaymentView.as_view(), name='demo_payment'),
    path('api/settings/', HospitalSettingView.as_view(), name='hospital_settings'),
    
    # Dashboard/Analytics Endpoints
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('api/dashboard/appointment-trends/', AppointmentTrendsView.as_view(), name='appointment_trends'),
    path('api/dashboard/revenue/', RevenueAnalyticsView.as_view(), name='revenue_analytics'),
    path('api/dashboard/department-stats/', DepartmentStatsView.as_view(), name='department_stats'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
