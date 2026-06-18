from rest_framework import serializers

from apps.tournaments.models import Tournament, TournamentParticipant


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = (
            "id",
            "creator",
            "title",
            "stages_count",
            "problems_per_stage",
            "stage_duration_s",
            "status",
            "started_at",
            "finished_at",
            "created_at",
        )
        read_only_fields = ("id", "creator", "status", "started_at", "finished_at", "created_at")


class TournamentParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentParticipant
        fields = ("id", "tournament", "user", "total_score", "current_stage", "joined_at")
        read_only_fields = ("id", "user", "total_score", "current_stage", "joined_at")
