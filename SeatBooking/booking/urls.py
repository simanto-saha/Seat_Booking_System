from django.urls import path
from . import views

urlpatterns = [
    path('create_account/', views.create_account, name='create_account'),
    path('login/', views.account_login, name='account_login'),
    path('logout/', views.account_logout, name='account_logout'),
    path('generate-otp/', views.generate_otp, name='generate_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),

    path('seats/', views.get_seats),          
    path('book/', views.booking),             
    path('cancel/<int:booking_id>/', views.cancel_booking), 
    path('my-bookings/', views.my_bookings), 
]