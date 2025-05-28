from rest_framework.permissions import BasePermission

class IsProfessorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return user.is_authenticated and (
            user.is_staff or hasattr(user, 'professor')
        )