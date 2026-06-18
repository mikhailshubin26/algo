import uuid

from django.conf import settings
from django.db import models


class Tournament(models.Model):
    """Турнир. Соответствует таблице ``tournaments``.

    Согласно главе 2 пояснительной записки турнир состоит из 5 этапов
    по 3 задачи в каждом, на прохождение одного этапа отводится 5 минут.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Ожидание"
        ONGOING = "ongoing", "Идёт"
        FINISHED = "finished", "Завершён"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_tournaments"
    )
    title = models.CharField(max_length=255)
    stages_count = models.PositiveIntegerField(default=5)
    problems_per_stage = models.PositiveIntegerField(default=3)
    stage_duration_s = models.PositiveIntegerField(default=300)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title


class TournamentParticipant(models.Model):
    """Участник турнира. Соответствует таблице ``tournament_participants``."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tournament_participations"
    )
    total_score = models.PositiveIntegerField(default=0)
    current_stage = models.PositiveIntegerField(default=1)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tournament", "user")

    def __str__(self) -> str:
        return f"{self.user} @ {self.tournament}"
