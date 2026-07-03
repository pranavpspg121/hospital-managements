"""
Management command to create a default superuser if none exists.
Usage: python manage.py create_default_superuser
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a default superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get('DJANGO_SU_EMAIL', 'admin@hospital.com')
        password = os.environ.get('DJANGO_SU_PASSWORD', 'Admin@123456')
        
        if not User.objects.filter(email=username).exists():
            User.objects.create_superuser(
                email=username,
                password=password,
                first_name='Admin',
                last_name='User',
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser created: {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️  Superuser already exists: {username}'))
