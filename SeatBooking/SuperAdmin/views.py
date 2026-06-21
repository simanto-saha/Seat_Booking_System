from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import AdminProfile

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import secrets
import string
from django.core.mail import send_mail
from django.conf import settings


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def superadmin_dashboard(request):
    if not request.user.is_superuser:
        return Response({"error": "You do not have permission to access this resource."}, status=403)

    total_admins = AdminProfile.objects.filter(is_admin=True).count()
    total_users = User.objects.count()

    return Response({
        "total_admins": total_admins,
        "total_users": total_users,
    }, status=200)




def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    # Eksure password e lowercase, uppercase, digit, special char thake
    while True:
        password = ''.join(secrets.choice(characters) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_admin_user(request):
    if request.method == 'POST':
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        designation = request.data.get('designation')

        if not email:
            return Response({"error": "Email is required."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=400)

        # Password auto-generate
        generated_password = generate_random_password()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=generated_password
        )
        AdminProfile.objects.create(
            user=user,
            phone_number=phone_number,
            designation=designation,
            must_change_password=True,
            is_admin=True
        )

        # Email pathano
        login_url = f"{settings.FRONTEND_URL}/login"
        subject = "Your Admin Account Has Been Created"
        message = (
            f"Hello,\n\n"
            f"An admin account has been created for you.\n\n"
            f"Login here: {login_url}\n"
            f"Email: {email}\n"
            f"Temporary Password: {generated_password}\n\n"
            f"Please login and change your password immediately.\n"
        )

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"success": "Admin user created but email failed to send.", "error": str(e)},
                status=201
            )

        return Response({"success": "Admin user created successfully and email sent."}, status=201)

    return Response({"error": "Invalid request method."}, status=405)