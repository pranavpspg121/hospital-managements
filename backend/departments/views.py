from rest_framework import viewsets, permissions
from django.db.models import Count
from departments.models import Department
from departments.serializers import DepartmentSerializer
from authentication.permissions import IsAdminUserRole

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        # Annotate with doctor count
        queryset = Department.objects.annotate(doctor_count=Count('doctors'))
        
        # Filtering
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        search = self.request.query_params.get('search')
        if search is not None:
            queryset = queryset.filter(name__icontains=search)
            
        return queryset.order_by('name')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.IsAuthenticated()]


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from departments.models import HospitalSetting
from departments.serializers import HospitalSettingSerializer
from authentication.permissions import IsAdminUserRole
from authentication.views import log_action

class HospitalSettingView(APIView):
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [permissions.AllowAny()]

    def get(self, request):
        settings, created = HospitalSetting.objects.get_or_create(id=1)
        serializer = HospitalSettingSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings, created = HospitalSetting.objects.get_or_create(id=1)
        serializer = HospitalSettingSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request.user, "Updated hospital contact settings", request)
        return Response(serializer.data)
