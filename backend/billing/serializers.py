from rest_framework import serializers
from billing.models import Payment
from appointments.serializers import AppointmentSerializer

class PaymentSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'appointment', 'appointment_details', 'amount', 'status', 'method', 'transaction_id', 'created_at']
