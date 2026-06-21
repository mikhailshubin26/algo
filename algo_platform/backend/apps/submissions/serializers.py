from rest_framework import serializers

from apps.submissions.models import Submission


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = (
            "id",
            "user",
            "problem",
            "tournament",
            "language",
            "source_code",
            "tests_passed",
            "is_accepted",
            "verdict",
            "exec_time_ms",
            "memory_kb",
            "error_output",
            "submitted_at",
        )
        read_only_fields = (
            "id",
            "user",
            "tests_passed",
            "is_accepted",
            "verdict",
            "exec_time_ms",
            "memory_kb",
            "error_output",
            "submitted_at",
        )
