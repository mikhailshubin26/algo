from rest_framework import serializers

from apps.tournaments.models import Tournament, TournamentParticipant, TournamentProblem


class TournamentProblemSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source="problem.title", read_only=True)

    class Meta:
        model = TournamentProblem
        fields = ("id", "problem", "problem_title", "stage", "order")


class TournamentSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source="creator.username", read_only=True)
    participants_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = (
            "id", "creator", "creator_username", "title",
            "stages_count", "problems_per_stage", "stage_duration_s",
            "status", "current_stage",
            "started_at", "finished_at", "created_at",
            "participants_count", "is_joined",
        )
        read_only_fields = ("id", "creator", "creator_username", "status", "current_stage",
                            "started_at", "finished_at", "created_at",
                            "participants_count", "is_joined")

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_is_joined(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.participants.filter(user=request.user).exists()


class TournamentDetailSerializer(TournamentSerializer):
    stage_problems = TournamentProblemSerializer(many=True, read_only=True)
    leaderboard = serializers.SerializerMethodField()

    class Meta(TournamentSerializer.Meta):
        fields = TournamentSerializer.Meta.fields + ("stage_problems", "leaderboard")

    def get_leaderboard(self, obj):
        qs = obj.participants.select_related("user").order_by("-total_score")
        return [
            {
                "id": str(p.id),
                "user_id": str(p.user.id),
                "username": p.user.username,
                "total_score": p.total_score,
                "current_stage": p.current_stage,
            }
            for p in qs
        ]


class TournamentParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentParticipant
        fields = ("id", "tournament", "user", "total_score", "current_stage", "joined_at")
        read_only_fields = ("id", "user", "total_score", "current_stage", "joined_at")
