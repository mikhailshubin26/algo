import uuid

from django.conf import settings
from django.db import models


class Message(models.Model):
    """Личное сообщение. Соответствует таблице ``messages``."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("sent_at",)

    def __str__(self) -> str:
        return f"{self.sender} -> {self.receiver}: {self.content[:30]}"
