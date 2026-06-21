from django.urls import path
from . import views

urlpatterns = [
    path('change-password/', views.change_password, name='change_password'),
]