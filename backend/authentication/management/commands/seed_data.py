from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from departments.models import Department
from doctors.models import Doctor
from patients.models import Patient
from slots.models import Slot
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial departments, doctors, slots, and test users'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database data...")

        # 1. Create Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            email='admin@hospital.com',
            defaults={
                'first_name': 'Hospital',
                'last_name': 'Admin',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('Admin@123')
            admin_user.save()
            self.stdout.write("Admin user created: admin@hospital.com / Admin@123")

        # 2. Create Patient
        patient_user, created = User.objects.get_or_create(
            username='patient',
            email='patient@test.com',
            defaults={
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'PATIENT'
            }
        )
        if created:
            patient_user.set_password('Patient@123')
            patient_user.save()
            Patient.objects.get_or_create(
                user=patient_user,
                defaults={
                    'phone': '9876543210',
                    'address': '123 Test Street, New Delhi',
                    'date_of_birth': datetime.date(1995, 8, 15),
                    'blood_group': 'O+',
                    'emergency_no': '9111222333'
                }
            )
            self.stdout.write("Patient user created: patient@test.com / Patient@123")

        # 3. Create Departments
        depts_data = [
            {'name': 'Cardiology', 'description': 'Heart health and treatment services'},
            {'name': 'Neurology', 'description': 'Brain and nervous system diagnostics'},
            {'name': 'Pediatrics', 'description': 'Child healthcare and immunizations'},
            {'name': 'Dermatology', 'description': 'Skin, hair, and nail healthcare'},
            {'name': 'Orthopedics', 'description': 'Musculoskeletal system and joint care'},
        ]
        
        depts = {}
        for dept in depts_data:
            obj, created = Department.objects.get_or_create(
                name=dept['name'],
                defaults={'description': dept['description']}
            )
            depts[dept['name']] = obj

        self.stdout.write("Departments seeded.")

        # 4. Create Doctors & Slots
        doctors_data = [
            {
                'username': 'rajesh_cardio',
                'email': 'rajesh@hospital.com',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'dept': 'Cardiology',
                'spec': 'Cardiologist',
                'qual': 'MD, DM (Cardiology)',
                'exp': 15,
                'fee': 500.00,
                'days': ['Monday', 'Wednesday', 'Friday']
            },
            {
                'username': 'sarah_neuro',
                'email': 'sarah@hospital.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'dept': 'Neurology',
                'spec': 'Neurologist',
                'qual': 'MD, PhD (Neurology)',
                'exp': 12,
                'fee': 600.00,
                'days': ['Tuesday', 'Thursday']
            },
            {
                'username': 'amit_pedia',
                'email': 'amit@hospital.com',
                'first_name': 'Amit',
                'last_name': 'Sharma',
                'dept': 'Pediatrics',
                'spec': 'Pediatrician',
                'qual': 'MD (Pediatrics), DCH',
                'exp': 8,
                'fee': 400.00,
                'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            },
            {
                'username': 'elena_derma',
                'email': 'elena@hospital.com',
                'first_name': 'Elena',
                'last_name': 'Rostova',
                'dept': 'Dermatology',
                'spec': 'Dermatologist',
                'qual': 'MD (Dermatology)',
                'exp': 10,
                'fee': 450.00,
                'days': ['Wednesday', 'Friday', 'Saturday']
            },
            {
                'username': 'david_ortho',
                'email': 'david@hospital.com',
                'first_name': 'David',
                'last_name': 'Miller',
                'dept': 'Orthopedics',
                'spec': 'Orthopedic Surgeon',
                'qual': 'MS (Orthopedics), MCh',
                'exp': 14,
                'fee': 500.00,
                'days': ['Monday', 'Thursday']
            }
        ]

        for doc in doctors_data:
            doc_user, created = User.objects.get_or_create(
                username=doc['username'],
                email=doc['email'],
                defaults={
                    'first_name': doc['first_name'],
                    'last_name': doc['last_name'],
                    'role': 'DOCTOR'
                }
            )
            if created:
                doc_user.set_password('Doctor@123')
                doc_user.save()
            
            doctor, created = Doctor.objects.get_or_create(
                user=doc_user,
                defaults={
                    'department': depts[doc['dept']],
                    'specialization': doc['spec'],
                    'qualification': doc['qual'],
                    'experience': doc['exp'],
                    'fee': doc['fee'],
                    'avail_days': doc['days']
                }
            )

            # Generate default active slots for this doctor
            # Morning Slot: 10:00 - 12:00, 30 min duration
            # Afternoon Slot: 14:00 - 17:00, 30 min duration
            if created:
                for day in doc['days']:
                    # Morning Slot
                    Slot.objects.create(
                        doctor=doctor,
                        day_of_week=day,
                        start_time=datetime.time(10, 0),
                        end_time=datetime.time(12, 0),
                        duration=30,
                        max_patients=4
                    )
                    # Afternoon Slot
                    Slot.objects.create(
                        doctor=doctor,
                        day_of_week=day,
                        start_time=datetime.time(14, 0),
                        end_time=datetime.time(17, 0),
                        duration=30,
                        max_patients=6
                    )
                self.stdout.write(f"Doctor profile & slots created for Dr. {doc['first_name']} {doc['last_name']}")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
