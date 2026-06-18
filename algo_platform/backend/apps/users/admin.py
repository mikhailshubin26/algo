from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_blocked", "tournament_rating", "streak")
    list_filter = ("role", "is_blocked")
    fieldsets = UserAdmin.fieldsets + (
        ("Платформа", {"fields": ("role", "is_blocked", "tournament_rating", "streak", "last_active_date")}),
    )
