from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from patients.models import Patient
from patients.serializers import PatientSerializer, PatientUpdateSerializer
from authentication.permissions import IsAdminUserRole, IsDoctorUserRole

class PatientViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.role == 'DOCTOR':
            return Patient.objects.select_related('user').all()
        elif user.role == 'PATIENT':
            return Patient.objects.select_related('user').filter(user=user)
        return Patient.objects.none()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return PatientUpdateSerializer
        return PatientSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        # Only Admin can delete
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied("Only Administrators can deactivate patients.")
        instance.delete()
