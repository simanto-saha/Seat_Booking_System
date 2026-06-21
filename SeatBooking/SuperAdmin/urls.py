from django.urls import path
from . import views

urlpatterns = [
    path('create-admin/', views.create_admin_user, name='create_admin_user'),
    path('super-user-dashboard/', views.superadmin_dashboard, name='super_user_dashboard'),
]