import uuid

from django.conf import settings
from django.db import models

from apps.problems.models import Problem
from apps.tournaments.models import Tournament


class Submission(models.Model):
    """Посылка решения. Соответствует таблице ``submissions``."""

    class Verdict(models.TextChoices):
        PENDING = "PENDING", "В обработке"
        AC = "AC", "Accepted"
        WA = "WA", "Wrong Answer"
        TLE = "TLE", "Time Limit Exceeded"
        MLE = "MLE", "Memory Limit Exceeded"
        CE = "CE", "Compilation Error"
        RE = "RE", "Runtime Error"

    class Language(models.TextChoices):
        PYTHON = "python", "Python"
        CPP = "cpp", "C++"
        C = "c", "C"
        GO = "go", "Go"
        JAVA = "java", "Java"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="submissions")
    tournament = models.ForeignKey(
        Tournament, on_delete=models.SET_NULL, related_name="submissions", null=True, blank=True
    )
    language = models.CharField(max_length=16, choices=Language.choices)
    source_code = models.TextField()
    tests_passed = models.PositiveIntegerField(default=0)
    is_accepted = models.BooleanField(default=False)
    verdict = models.CharField(max_length=16, choices=Verdict.choices, default=Verdict.PENDING)
    exec_time_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_kb = models.PositiveIntegerField(null=True, blank=True)
    error_output = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-submitted_at",)

    def __str__(self) -> str:
        return f"{self.user} -> {self.problem} ({self.verdict})"
