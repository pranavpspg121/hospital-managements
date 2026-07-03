from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HospitalSetting(models.Model):
    address = models.TextField(default="123 Health Ave, New Delhi")
    phone = models.CharField(max_length=50, default="+1 (558) 955-4885")
    email = models.EmailField(default="info@medicare.com")

    def __str__(self):
        return "Hospital Settings"
