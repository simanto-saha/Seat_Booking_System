from django.db import models


class Seat(models.Model):
    seat_number = models.CharField(max_length=10)  # unique=True remove kora hoyeche
    train_number = models.CharField(max_length=20, null=True, blank=True)
    train_name = models.CharField(max_length=100, null=True, blank=True)
    arrival_time = models.TimeField(null=True, blank=True)
    departure_time = models.TimeField(null=True, blank=True)
    distination = models.CharField(max_length=100, null=True, blank=True)
    seat_available = models.BooleanField(default=True)
    date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('date', 'train_number', 'seat_number')

    def __str__(self):
        return f"Seat {self.seat_number} - {self.train_number} - {self.date}"