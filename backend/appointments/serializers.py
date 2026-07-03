from rest_framework import serializers
from datetime import date, datetime
from appointments.models import Appointment, Prescription
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
from slots.serializers import SlotSerializer
from slots.models import Slot

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['id', 'appointment', 'diagnosis', 'notes', 'medicines', 'follow_up_date', 'created_at']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    slot_details = SlotSerializer(source='slot', read_only=True)
    prescription = PrescriptionSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_details', 'doctor', 'doctor_details', 
            'slot', 'slot_details', 'appt_date', 'slot_time', 'status', 
            'payment_status', 'symptoms', 'amount', 'razorpay_ord_id', 
            'razorpay_pay_id', 'cancel_reason', 'cancelled_by', 
            'rescheduled_from', 'prescription', 'created_at', 'updated_at'
        ]

class AppointmentCreateSerializer(serializers.ModelSerializer):
    slot_time = serializers.TimeField(required=False)

    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'slot', 'appt_date', 'slot_time', 'symptoms', 'amount']
        read_only_fields = ['id', 'amount']

    def validate(self, attrs):
        slot = attrs.get('slot')
        if not attrs.get('slot_time') and slot:
            attrs['slot_time'] = slot.start_time

        appt_date = attrs.get('appt_date')
        slot_time = attrs.get('slot_time')
        doctor = attrs.get('doctor')
        
        # Access the requesting user
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")
        
        # Ensure user is a Patient
        if request.user.role != 'PATIENT' or not hasattr(request.user, 'patient'):
            raise serializers.ValidationError("Only patients can book appointments.")
        
        patient = request.user.patient

        # 1. Cannot book past date
        if appt_date < date.today():
            raise serializers.ValidationError("Cannot book appointments for past dates.")

        # 2. Cannot book more than 30 days ahead
        days_ahead = (appt_date - date.today()).days
        if days_ahead > 30:
            raise serializers.ValidationError("Cannot book appointments more than 30 days in advance.")

        # 3. Ensure Doctor slot exists, is active, matches weekday, and matches slot_time
        if slot:
            day_name = appt_date.strftime('%A')
            if slot.day_of_week != day_name:
                raise serializers.ValidationError(f"The selected slot is not active on {day_name}.")
            if not slot.is_active:
                raise serializers.ValidationError("This time slot is currently inactive.")
            if slot.doctor != doctor:
                raise serializers.ValidationError("The selected slot does not belong to the selected doctor.")

        # 4. Patient double-booking prevention (cannot book the same slot on the same date twice)
        duplicate_appt = Appointment.objects.filter(
            patient=patient,
            appt_date=appt_date,
            slot=slot,
            status__in=['Pending', 'Confirmed']
        ).exists()
        if duplicate_appt:
            raise serializers.ValidationError("You already have an appointment booked for this slot on this date.")

        # 5. Overbooking prevention for the selected slot on this date
        if slot:
            bookings_count = Appointment.objects.filter(
                slot=slot,
                appt_date=appt_date,
                status__in=['Pending', 'Confirmed']
            ).count()
            if bookings_count >= slot.max_patients:
                raise serializers.ValidationError("This time slot is fully booked for the selected date.")

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        patient = request.user.patient
        doctor = validated_data['doctor']
        
        # Populate amount based on doctor's consultation fee
        validated_data['amount'] = doctor.fee
        validated_data['patient'] = patient
        
        return super().create(validated_data)
