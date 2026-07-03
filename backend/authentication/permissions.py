from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class IsDoctorUserRole(permissions.BasePermission):
    """
    Allows access only to Doctor users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'DOCTOR'

class IsPatientUserRole(permissions.BasePermission):
    """
    Allows access only to Patient users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'PATIENT'

class IsAdminOrDoctor(permissions.BasePermission):
    """
    Allows access to both Admin and Doctor roles.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'DOCTOR']
