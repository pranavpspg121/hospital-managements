from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from doctors.models import Doctor
from doctors.serializers import DoctorSerializer, DoctorCreateUpdateSerializer
from authentication.permissions import IsAdminUserRole

class DoctorViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = Doctor.objects.select_related('user', 'department').all()
        
        # Filters
        department = self.request.query_params.get('department')
        if department is not None:
            queryset = queryset.filter(department_id=department)
            
        specialization = self.request.query_params.get('specialization')
        if specialization is not None:
            queryset = queryset.filter(specialization__icontains=specialization)
            
        search = self.request.query_params.get('search')
        if search is not None:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(specialization__icontains=search)
            )
            
        ordering = self.request.query_params.get('ordering')
        if ordering is not None:
            queryset = queryset.order_by(ordering)
            
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DoctorCreateUpdateSerializer
        return DoctorSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available(self, request):
        """
        List active doctors only.
        """
        active_doctors = Doctor.objects.select_related('user', 'department').filter(is_active=True)
        serializer = DoctorSerializer(active_doctors, many=True)
        return Response(serializer.data)
