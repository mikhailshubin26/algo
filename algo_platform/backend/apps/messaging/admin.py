from django.contrib import admin

from apps.messaging.models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "is_read", "sent_at")
