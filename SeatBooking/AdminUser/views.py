from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import permissions

from SuperAdmin.models import AdminProfile

class MustChangePasswordPermission(permissions.BasePermission):
    """
    Blocks access if admin's must_change_password is True.
    """
    message = "You must change your password before accessing this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        try:
            admin_profile = AdminProfile.objects.get(user=request.user)
            return not admin_profile.must_change_password
        except AdminProfile.DoesNotExist:
            return True  



@api_view(['POST'])
@permission_classes([IsAuthenticated, MustChangePasswordPermission])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    confirm_new_password = request.data.get('confirm_new_password')

    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect."}, status=400)

    if new_password != confirm_new_password:
        return Response({"error": "Passwords do not match."}, status=400)

    user.set_password(new_password)
    user.save()

    admin_profile = AdminProfile.objects.filter(user=user).first()
    if admin_profile:
        admin_profile.must_change_password = False
        admin_profile.save()

    return Response({"success": "Password changed successfully."}, status=200)
