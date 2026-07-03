"""
Management command to create a default superuser if none exists.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a default superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get('DJANGO_SU_USERNAME', 'admin')
        email    = os.environ.get('DJANGO_SU_EMAIL', 'admin@hospital.com')
        password = os.environ.get('DJANGO_SU_PASSWORD', 'Admin@123456')

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name='Admin',
                last_name='User',
                role='ADMIN',
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser created: {username} / {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️  Superuser already exists: {username}'))
