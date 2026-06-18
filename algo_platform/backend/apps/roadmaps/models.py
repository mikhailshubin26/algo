import uuid

from django.conf import settings
from django.db import models


class Roadmap(models.Model):
    """Дорожная карта. Соответствует таблице ``roadmaps``."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Активна"
        DELETED = "deleted", "Удалена"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="roadmaps"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title


class RoadmapNode(models.Model):
    """Узел дорожной карты. Соответствует таблице ``roadmap_nodes``.

    Дорожная карта представляет собой ориентированное дерево: каждый узел
    содержит ссылку на родительский узел (``parent``), у корневых узлов
    это поле равно ``NULL``.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name="nodes")
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("position",)

    def __str__(self) -> str:
        return self.title
