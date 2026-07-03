from rest_framework import serializers
from slots.models import Slot
from doctors.serializers import DoctorSerializer

class SlotSerializer(serializers.ModelSerializer):
    doctor_details = DoctorSerializer(source='doctor', read_only=True)

    class Meta:
        model = Slot
        fields = ['id', 'doctor', 'doctor_details', 'day_of_week', 'start_time', 'end_time', 'duration', 'max_patients', 'break_start', 'break_end', 'is_active']

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        break_start = attrs.get('break_start')
        break_end = attrs.get('break_end')
        doctor = attrs.get('doctor')
        day_of_week = attrs.get('day_of_week')

        # Check start and end times
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time.")

        # Check break times
        if break_start and break_end:
            if break_start >= break_end:
                raise serializers.ValidationError("Break start must be before break end.")
            if start_time and end_time:
                if break_start < start_time or break_end > end_time:
                    raise serializers.ValidationError("Break time must be within the slot start and end times.")

        # Check overlapping slots for the same doctor on the same day
        if doctor and day_of_week and start_time and end_time:
            overlapping_slots = Slot.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_active=True
            ).exclude(id=self.instance.id if self.instance else None)

            for existing in overlapping_slots:
                # Check overlapping conditions
                if not (end_time <= existing.start_time or start_time >= existing.end_time):
                    raise serializers.ValidationError(
                        f"This slot overlaps with an existing slot ({existing.start_time} - {existing.end_time}) on {day_of_week}."
                    )
        return attrs
