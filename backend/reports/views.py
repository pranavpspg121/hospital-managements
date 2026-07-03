from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.http import FileResponse
from reports.models import Report
from reports.serializers import ReportSerializer
from authentication.permissions import IsAdminOrDoctor

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.select_related('patient__user', 'doctor__user').all()

        if user.role == 'PATIENT':
            queryset = queryset.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            queryset = queryset.filter(doctor__user=user)

        return queryset.order_by('-uploaded_at')

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrDoctor()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'DOCTOR' and hasattr(user, 'doctor'):
            serializer.save(doctor=user.doctor)
        else:
            serializer.save()
            
    # Custom action to download report
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Verify access permission
        user = request.user
        if user.role == 'PATIENT' and instance.patient.user != user:
            return Response({"error": "You do not have permission to view this report."}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'DOCTOR' and instance.doctor.user != user:
            return Response({"error": "You do not have permission to view this report."}, status=status.HTTP_403_FORBIDDEN)
            
        return super().retrieve(request, *args, **kwargs)
