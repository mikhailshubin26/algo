import uuid

from django.conf import settings
from django.db import models


class Problem(models.Model):
    """Задача. Соответствует таблице ``problems`` логической модели данных."""

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    class Status(models.TextChoices):
        ACTIVE = "active", "Активна"
        DELETED = "deleted", "Удалена"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="problems"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    constraints = models.TextField(help_text="Ограничения по времени и памяти")
    difficulty = models.CharField(max_length=16, choices=Difficulty.choices)
    test_file_path = models.CharField(max_length=512, blank=True, default="", help_text="Путь к закрытому набору тестов (устарело)")
    total_tests = models.PositiveIntegerField(default=0)
    time_limit_ms = models.PositiveIntegerField(default=1000)
    memory_limit_mb = models.PositiveIntegerField(default=256)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title


class TestCase(models.Model):
    """Один тест-кейс задачи: входные данные и ожидаемый вывод."""

    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="test_cases")
    input_data = models.TextField(blank=True, default="")
    expected_output = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order",)

    def __str__(self) -> str:
        return f"Test #{self.order} for {self.problem}"
