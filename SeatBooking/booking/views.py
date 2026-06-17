from django.shortcuts import render
from django.http import JsonResponse


def home(request):

    data = {
        'message': 'Welcome to the Seat Booking System'
    }

    return JsonResponse(data)

