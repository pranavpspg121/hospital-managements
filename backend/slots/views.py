from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime, timedelta
from slots.models import Slot
from slots.serializers import SlotSerializer
from appointments.models import Appointment
from authentication.permissions import IsAdminUserRole, IsDoctorUserRole

class SlotViewSet(viewsets.ModelViewSet):
    serializer_class = SlotSerializer

    def get_queryset(self):
        queryset = Slot.objects.select_related('doctor__user').all()
        
        # Filtering
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id is not None:
            queryset = queryset.filter(doctor_id=doctor_id)
            
        day_of_week = self.request.query_params.get('day_of_week')
        if day_of_week is not None:
            queryset = queryset.filter(day_of_week=day_of_week)
            
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminUserRole() | IsDoctorUserRole()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def doctor_availability(self, request):
        """
        Get slots for a doctor on a specific date, indicating which slots are fully booked.
        Query params: doctor (ID), date (YYYY-MM-DD)
        """
        doctor_id = request.query_params.get('doctor')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response(
                {"error": "Please provide 'doctor' ID and 'date' (YYYY-MM-DD) query parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        day_name = date_obj.strftime('%A')  # e.g., 'Monday'
        
        # Fetch active slots for this doctor on this weekday
        slots = Slot.objects.filter(doctor_id=doctor_id, day_of_week=day_name, is_active=True)
        
        # Fetch existing appointments for this doctor on this day
        appointments = Appointment.objects.filter(
            doctor_id=doctor_id,
            appt_date=date_obj,
            status__in=['Pending', 'Confirmed']
        )
        
        # Create slot availability mapping
        booked_slots = {}
        for appt in appointments:
            if appt.slot_id:
                booked_slots[appt.slot_id] = booked_slots.get(appt.slot_id, 0) + 1

        result = []
        for slot in slots:
            current_bookings = booked_slots.get(slot.id, 0)
            is_booked = current_bookings >= slot.max_patients
            
            result.append({
                'id': slot.id,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'break_start': slot.break_start.strftime('%H:%M') if slot.break_start else None,
                'break_end': slot.break_end.strftime('%H:%M') if slot.break_end else None,
                'max_patients': slot.max_patients,
                'current_bookings': current_bookings,
                'is_booked': is_booked,
            })

        return Response(result)
