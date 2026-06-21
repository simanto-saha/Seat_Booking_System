import re
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import authenticate, login, logout
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .redis_locks import seat_lock, SeatLockError
from contextlib import ExitStack


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
import uuid

from .models import UserCreate, OTP_generate, SeatBooking, Payment, BookedSeat
from SuperAdmin.models import AdminProfile
from AdminUser.models import Seat


def is_strong_password(password):
    """
    Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one digit.'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, 'Password must contain at least one special character.'
    return True, None


@api_view(['POST'])
def create_account(request):
    full_name = request.data.get('full_name')
    email = request.data.get('email')
    nid = request.data.get('nid')
    phone_number = request.data.get('phone_number')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')

    if not all([full_name, email, nid, phone_number, password, confirm_password]):
        return Response({'error': 'All fields are required.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return Response({'error': 'Invalid email address.'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists.'}, status=400)

    if UserCreate.objects.filter(nid=nid).exists():
        return Response({'error': 'NID already exists.'}, status=400)

    if UserCreate.objects.filter(phone_number=phone_number).exists():
        return Response({'error': 'Phone number already exists.'}, status=400)

    if password != confirm_password:
        return Response({'error': 'Passwords do not match.'}, status=400)

    is_valid, error_message = is_strong_password(password)
    if not is_valid:
        return Response({'error': error_message}, status=400)
    
    from django.core.cache import cache
    
    
    if not cache.get(f"reg_otp_verified_{email}"):
        return Response({'error': 'Email not verified. Please verify OTP first.'}, status=403)

    user = User.objects.create_user(username=nid, password=password, email=email)
    UserCreate.objects.create(user=user, full_name=full_name, nid=nid, phone_number=phone_number)
    
    
    cache.delete(f"reg_otp_verified_{email}")


    return Response({'message': 'Account created successfully.'}, status=201)


@api_view(['POST'])
def generate_otp(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required.'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'No account found with this email.'}, status=404)

    recent_otp = OTP_generate.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timedelta(minutes=1)
    ).first()

    if recent_otp:
        return Response({'error': 'Please wait before requesting another OTP.'}, status=429)

    otp_code = str(random.randint(100000, 999999))
    otp_obj = OTP_generate(user=user)
    otp_obj.set_otp(otp_code)
    otp_obj.save()

    try:
        send_mail(
            subject='Your OTP Code',
            message=f'Your OTP code is: {otp_code}. This code is valid for 5 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        otp_obj.delete()
        return Response({'error': 'Failed to send OTP email.'}, status=500)

    return Response({'message': 'OTP sent to your email successfully.'}, status=200)


@api_view(['POST'])
def send_registration_otp(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required.'}, status=400)

    # Email already registered?
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists.'}, status=400)

    
    from django.core.cache import cache

    cache_key = f"reg_otp_{email}"
    
    
    if cache.get(f"reg_otp_cooldown_{email}"):
        return Response({'error': 'Please wait before requesting another OTP.'}, status=429)

    otp_code = str(random.randint(100000, 999999))
    
    
    cache.set(cache_key, otp_code, timeout=300)
    cache.set(f"reg_otp_cooldown_{email}", True, timeout=60)

    try:
        send_mail(
            subject='Your OTP Code',
            message=f'Your OTP code is: {otp_code}. This code is valid for 5 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        cache.delete(cache_key)
        return Response({'error': 'Failed to send OTP email.'}, status=500)

    return Response({'message': 'OTP sent to your email successfully.'}, status=200)


@api_view(['POST'])
def verify_registration_otp(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')

    if not email or not otp_code:
        return Response({'error': 'Email and OTP are required.'}, status=400)

    from django.core.cache import cache
    
    saved_otp = cache.get(f"reg_otp_{email}")
    
    if not saved_otp:
        return Response({'error': 'OTP expired or not found.'}, status=400)
    
    if saved_otp != otp_code:
        return Response({'error': 'Invalid OTP code.'}, status=400)

    
    cache.delete(f"reg_otp_{email}")
    cache.set(f"reg_otp_verified_{email}", True, timeout=600)  # 10 মিনিট সময় account বানাতে

    return Response({'message': 'OTP verified successfully.'}, status=200)


@api_view(['GET'])
def home(request):
    user = request.user

    if not user.is_authenticated:
        return Response({'role': 'guest', 'message': 'Welcome, Guest!'})

    if user.is_superuser:
        return Response({'role': 'superadmin', 'message': f'Welcome, {user.username}!'})

    try:
        admin_profile = AdminProfile.objects.get(user=user)
        return Response({
            'role': 'admin',
            'message': f'Welcome, {user.username}!',
            'must_change_password': admin_profile.must_change_password
        })
    except AdminProfile.DoesNotExist:
        pass

    try:
        profile = UserCreate.objects.get(user=user)
        return Response({'role': 'user', 'message': f'Welcome, {profile.full_name}!'})
    except UserCreate.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=404)


@api_view(['POST'])
def account_login(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return Response({'error': 'identifier and password required'}, status=400)

    if '@' in identifier:
        try:
            user = User.objects.get(email=identifier)
            username = user.username
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=400)
    else:
        try:
            profile = UserCreate.objects.get(nid=identifier)
            username = profile.user.username
        except UserCreate.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=400)

    login(request, user)

    if user.is_superuser:
        return Response({'message': f'Welcome, {user.username}!', 'role': 'superadmin'})

    try:
        admin_profile = AdminProfile.objects.get(user=user)
        return Response({
            'message': f'Welcome, {user.username}!',
            'role': 'admin',
            'must_change_password': admin_profile.must_change_password
        })
    except AdminProfile.DoesNotExist:
        pass

    try:
        profile = UserCreate.objects.get(user=user)
        return Response({'message': f'Welcome, {profile.full_name}!', 'role': 'user'})
    except UserCreate.DoesNotExist:
        return Response({'error': 'User profile incomplete. Please contact support.'}, status=400)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_logout(request):
    logout(request)
    return Response({'message': 'Logout successful.'}, status=200)



@api_view(['GET'])
def get_seats(request):
    """All Seat list + availability"""
    date = request.query_params.get('date')  # ?date=2026-06-20

    seats = Seat.objects.all()
    data = []

    for seat in seats:
        is_available = True
        if date:
            is_available = not BookedSeat.objects.filter(
                seat=seat,
                arrival_date=date,
                booking__status__in=['pending', 'confirmed']
            ).exists()

        data.append({
            'id': seat.id,
            'seat_number': seat.seat_number,
            'is_available': is_available,
        })

    return Response(data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def booking(request):
    seat_ids = request.data.get('seat_ids', [])
    arrival_date = request.data.get('arrival_date')
    amount = request.data.get('amount')

    if not seat_ids or not arrival_date or not amount:
        return Response(
            {'error': 'seat_ids, arrival_date, amount required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    
    sorted_seat_ids = sorted(seat_ids)

    try:
        with ExitStack() as stack:
            
            for seat_id in sorted_seat_ids:
                stack.enter_context(seat_lock(seat_id, arrival_date))

            with transaction.atomic():
                for seat_id in seat_ids:
                    already_booked = BookedSeat.objects.filter(
                        seat_id=seat_id,
                        arrival_date=arrival_date,
                        booking__status__in=['pending', 'confirmed']
                    ).exists()
                    if already_booked:
                        seat = Seat.objects.get(id=seat_id)
                        return Response(
                            {'error': f'Seat {seat.seat_number} already booked for {arrival_date}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                payment = Payment.objects.create(
                    user=request.user,
                    amount=amount,
                    payment_data={'method': 'online', 'seat_ids': seat_ids},
                    is_successful=True,
                    invoice_number=str(uuid.uuid4())[:12].upper()
                )

                seat_booking = SeatBooking.objects.create(
                    user=request.user,
                    arrival_date=arrival_date,
                    payment=payment,
                    status='confirmed'
                )

                booked_seats = []
                for seat_id in seat_ids:
                    bs = BookedSeat.objects.create(
                        booking=seat_booking,
                        seat_id=seat_id,
                        arrival_date=arrival_date
                    )
                    booked_seats.append(bs)

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    "seats",
                    {
                        "type": "seat.update",
                        "data": {
                            "event": "seat_booked",
                            "seat_ids": seat_ids,
                            "arrival_date": arrival_date,
                            "booked_by": request.user.username,
                        }
                    }
                )

                return Response({
                    'booking_id': seat_booking.id,
                    'status': seat_booking.status,
                    'ticket_checker': seat_booking.ticket_checker,
                    'invoice_number': payment.invoice_number,
                    'seats': [bs.seat.seat_number for bs in booked_seats],
                    'arrival_date': arrival_date,
                }, status=status.HTTP_201_CREATED)

    except SeatLockError:
        return Response(
            {'error': 'Seat is currently being booked by someone else, try again.'},
            status=status.HTTP_409_CONFLICT
        )
    except Seat.DoesNotExist:
        return Response({'error': 'Invalid seat_id'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    """Booking cancel"""
    try:
        seat_booking = SeatBooking.objects.get(id=booking_id, user=request.user)

        if seat_booking.status == 'cancelled':
            return Response({'error': 'Already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        seat_booking.status = 'cancelled'
        seat_booking.save()

        # Cancelled seat IDs
        seat_ids = list(
            seat_booking.booked_seats.values_list('seat_id', flat=True)
        )

        # WebSocket broadcast
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "seats",
            {
                "type": "seat.update",
                "data": {
                    "event": "seat_cancelled",
                    "seat_ids": seat_ids,
                    "arrival_date": str(seat_booking.arrival_date),
                }
            }
        )

        return Response({'message': 'Booking cancelled', 'booking_id': booking_id})

    except SeatBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    """Current user er সব booking"""
    bookings = SeatBooking.objects.filter(user=request.user).order_by('-booking_date')
    data = []
    for b in bookings:
        data.append({
            'booking_id': b.id,
            'status': b.status,
            'arrival_date': b.arrival_date,
            'ticket_checker': b.ticket_checker,
            'invoice_number': b.payment.invoice_number,
            'amount': b.payment.amount,
            'seats': [bs.seat.seat_number for bs in b.booked_seats.all()],
        })
    return Response(data)


# Searching seat availability for given date and distination
@api_view(['GET'])
def search_seats(request):
    date = request.query_params.get('date')
    distination = request.query_params.get('distination')

    seats = Seat.objects.filter(date=date, distination=distination, seat_available=True)
    
    # train wise group kore dekhano better, jate user train select korte pare
    trains = {}
    for seat in seats:
        key = seat.train_number
        if key not in trains:
            trains[key] = {
                "train_number": seat.train_number,
                "train_name": seat.train_name,
                "arrival_time": seat.arrival_time,
                "departure_time": seat.departure_time,
                "distination": seat.distination,
                "available_seats": 0
            }
        trains[key]["available_seats"] += 1

    return Response(list(trains.values()))
