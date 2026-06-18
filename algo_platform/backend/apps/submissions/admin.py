from django.contrib import admin

from apps.submissions.models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "language", "verdict", "is_accepted", "submitted_at")
    list_filter = ("verdict", "language")
