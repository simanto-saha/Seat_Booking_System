from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
import random


class UserCreate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)
    nid = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.full_name


class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_data = models.JSONField()
    payment_date = models.DateTimeField(auto_now_add=True)
    is_successful = models.BooleanField(default=False)
    invoice_number = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"Payment of {self.amount} by {self.user.username} on {self.payment_date}"


class Seat(models.Model):
    seat_number = models.CharField(max_length=10, unique=True)
    is_available = models.BooleanField(default=True)
    seat_available_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Seat {self.seat_number}"


class SeatBooking(models.Model):

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    booking_date = models.DateTimeField(auto_now_add=True)
    arrival_date = models.DateField()
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ticket_checker = models.CharField(max_length=100, blank=True)

    def generate_ticket_checker(self):
        while True:
            ticket_checker = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=8))
            if not SeatBooking.objects.filter(ticket_checker=ticket_checker).exists():
                return ticket_checker

    def save(self, *args, **kwargs):
        if self.status == 'confirmed' and not self.ticket_checker:
            self.ticket_checker = self.generate_ticket_checker()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking #{self.id} by {self.user.username} for {self.arrival_date}"


class BookedSeat(models.Model):
    booking = models.ForeignKey(SeatBooking, on_delete=models.CASCADE, related_name='booked_seats')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE)
    arrival_date = models.DateField() 
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['seat', 'arrival_date'], name='unique_seat_booking')
        ]

    def __str__(self):
        return f"Seat {self.seat.seat_number} on {self.arrival_date} ({self.booking.status})"


class OTP_generate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def set_otp(self, raw_otp):
        """plain otp ke hash kore save"""
        self.otp_code = make_password(raw_otp)

    def check_otp(self, raw_otp):
        """user er deya otp, stored hash er sathe match korbe"""
        return check_password(raw_otp, self.otp_code)

    def __str__(self):
        return f"OTP for {self.user.username} - {'Verified' if self.is_verified else 'Not Verified'}"
    


class Admin_User(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)

    def __str__(self):
        return self.full_name