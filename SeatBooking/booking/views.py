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

from .models import UserCreate, OTP_generate


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


def create_account(request):
    if request.method == 'POST':
        full_name = request.POST.get('full_name')
        email = request.POST.get('email')
        nid = request.POST.get('nid')
        phone_number = request.POST.get('phone_number')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        
        if not full_name or not email or not nid or not phone_number or not password or not confirm_password:
            return JsonResponse({'error': 'All fields are required.'}, status=400)

        # Email validation
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'error': 'Invalid email address.'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists.'}, status=400)

        if UserCreate.objects.filter(nid=nid).exists():
            return JsonResponse({'error': 'NID already exists.'}, status=400)

        if UserCreate.objects.filter(phone_number=phone_number).exists():
            return JsonResponse({'error': 'Phone number already exists.'}, status=400)

        if password != confirm_password:
            return JsonResponse({'error': 'Passwords do not match.'}, status=400)

        # Password strength check
        is_valid, error_message = is_strong_password(password)
        if not is_valid:
            return JsonResponse({'error': error_message}, status=400)

        user = User.objects.create_user(username=nid, password=password, email=email)

        UserCreate.objects.create(
            user=user,
            full_name=full_name,
            nid=nid,
            phone_number=phone_number
        )

        return JsonResponse({'message': 'Account created successfully.'}, status=201)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)


def generate_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email')

        if not email:
            return JsonResponse({'error': 'Email is required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'No account found with this email.'}, status=404)

        
        recent_otp = OTP_generate.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).first()

        if recent_otp:
            return JsonResponse({'error': 'Please wait before requesting another OTP.'}, status=429)

        
        otp_code = str(random.randint(100000, 999999))

        otp_obj = OTP_generate(user=user)
        otp_obj.set_otp(otp_code)  
        otp_obj.save()

        # Email sent
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
            return JsonResponse({'error': 'Failed to send OTP email.'}, status=500)

        return JsonResponse({'message': 'OTP sent to your email successfully.'}, status=200)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)


def verify_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        otp_code = request.POST.get('otp_code')

        if not email or not otp_code:
            return JsonResponse({'error': 'Email and OTP code are required.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'No account found with this email.'}, status=404)

        
        otp_candidates = OTP_generate.objects.filter(
            user=user,
            is_verified=False,
            created_at__gte=timezone.now() - timedelta(minutes=5)
        ).order_by('-created_at')

        matched_otp = None
        for otp_obj in otp_candidates:
            if otp_obj.check_otp(otp_code):
                matched_otp = otp_obj
                break

        if not matched_otp:
            return JsonResponse({'error': 'Invalid or expired OTP code.'}, status=400)

        matched_otp.is_verified = True
        matched_otp.save()

        return JsonResponse({'message': 'OTP verified successfully.'}, status=200)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)


def home(request):
    user = request.user
    if user.is_authenticated:
        user_name = UserCreate.objects.get(user=user).full_name

        return JsonResponse({'message': f'Welcome, {user_name}!'}, status=200)
    
    return JsonResponse({'message': 'Welcome, Guest! Please log in.'}, status=200)


def account_login(request):
    nid = request.POST.get('nid')
    password = request.POST.get('password')

    user = authenticate(request, username=nid, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({'message': 'Login successful.'}, status=200)
    else:
        return JsonResponse({'error': 'Invalid NID or password.'}, status=400)
    

def account_logout(request):
    logout(request)
    return JsonResponse({'message': 'Logout successful.'}, status=200)



def booking(request):
    return JsonResponse({'message': 'Booking endpoint - to be implemented.'}, status=200)


