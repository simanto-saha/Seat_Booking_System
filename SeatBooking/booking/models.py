from django.db import models
from django.contrib.auth.models import User
import random

class UserCreate(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
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


class SeatBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    seat_number = models.JSONField()
    seat_booked = models.BooleanField(default=False)
    booking_date = models.DateTimeField(auto_now_add=True)
    arrival_date = models.DateField()
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    ticket_checker = models.CharField(max_length=100)

    def generate_ticket_checker(self):
        while True:
            ticket_checker = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=8))
            if not SeatBooking.objects.filter(ticket_checker=ticket_checker).exists():
                return ticket_checker
    
    def save(self, *args, **kwargs):
        if self.seat_booked and not self.ticket_checker:
            self.ticket_checker = self.generate_ticket_checker()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Seat {self.seat_number} booked by {self.user.username} on {self.booking_date}"
    

class Seat(models.Model):
    seat_number = models.CharField(max_length=10, unique=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"Seat {self.seat_number} - {'Available' if self.is_available else 'Booked'}"
    
