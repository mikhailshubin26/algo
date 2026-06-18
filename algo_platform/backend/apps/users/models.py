import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Пользователь платформы. Структура соответствует таблице ``users``
    из логической модели данных (см. главу 2 пояснительной записки)."""

    class Role(models.TextChoices):
        USER = "user", "Пользователь"
        PREMIUM = "premium", "Премиум-пользователь"
        ADMIN = "admin", "Администратор"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.USER)
    is_blocked = models.BooleanField(default=False)
    tournament_rating = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_premium(self) -> bool:
        return self.role in (self.Role.PREMIUM, self.Role.ADMIN)

    def __str__(self) -> str:
        return self.username
