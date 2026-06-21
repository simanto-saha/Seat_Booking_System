from django.urls import path
from . import views

urlpatterns = [
    path('change-password/', views.change_password, name='change_password'),
    path('create-seat/', views.create_seat, name='create_seat'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
]