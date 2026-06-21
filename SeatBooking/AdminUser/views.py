from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import permissions

from SuperAdmin.models import AdminProfile
from booking.models import SeatBooking, BookedSeat
from .models import Seat


TOTAL_SEATS = 1020

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


@api_view(['GET'])
@permission_classes([IsAuthenticated, MustChangePasswordPermission])
def admin_dashboard(request):
    if not request.user.is_admin:
        return Response({"error": "You do not have permission to access this resource."}, status=403)
    



@api_view(['POST'])
@permission_classes([IsAuthenticated, MustChangePasswordPermission])
def create_seat(request):
    date = request.data.get('date')
    train_number = request.data.get('train_number')
    train_name = request.data.get('train_name')
    arrival_time = request.data.get('arrival_time')
    departure_time = request.data.get('departure_time')
    distination = request.data.get('distination')

    if not date or not train_number:
        return Response({"error": "date and train_number are required."}, status=400)

    # already create hoye thakle duplicate prevent kora
    if Seat.objects.filter(date=date, train_number=train_number).exists():
        return Response(
            {"error": f"Seats already created for train {train_number} on {date}."},
            status=400
        )

    seats = [
        Seat(
            seat_number=str(i),
            train_number=train_number,
            train_name=train_name,
            arrival_time=arrival_time,
            departure_time=departure_time,
            distination=distination,
            seat_available=True,
            date=date,
        )
        for i in range(1, TOTAL_SEATS + 1)
    ]

    Seat.objects.bulk_create(seats)

    return Response(
        {"success": f"{TOTAL_SEATS} seats created for {train_name} ({train_number}) on {date}."},
        status=201
    )