from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.tournaments.models import Tournament, TournamentParticipant, TournamentProblem
from apps.tournaments.serializers import (
    TournamentDetailSerializer,
    TournamentParticipantSerializer,
    TournamentProblemSerializer,
    TournamentSerializer,
)


class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.select_related("creator").all()
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TournamentDetailSerializer
        return TournamentSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    # ── join ──────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        tournament = self.get_object()
        if tournament.status == Tournament.Status.FINISHED:
            return Response({"error": "Турнир завершён"}, status=400)
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=request.user
        )
        return Response(
            TournamentParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    # ── start ─────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        tournament = self.get_object()
        if tournament.creator != request.user:
            return Response({"error": "Только создатель может запустить турнир"}, status=403)
        if tournament.status != Tournament.Status.PENDING:
            return Response({"error": "Турнир уже запущен или завершён"}, status=400)
        tournament.status = Tournament.Status.ONGOING
        tournament.current_stage = 1
        tournament.started_at = timezone.now()
        tournament.save(update_fields=["status", "current_stage", "started_at"])
        return Response(TournamentDetailSerializer(tournament, context={"request": request}).data)

    # ── next_stage ────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="next_stage")
    def next_stage(self, request, pk=None):
        tournament = self.get_object()
        if tournament.creator != request.user:
            return Response({"error": "Только создатель"}, status=403)
        if tournament.status != Tournament.Status.ONGOING:
            return Response({"error": "Турнир не идёт"}, status=400)
        if tournament.current_stage >= tournament.stages_count:
            tournament.status = Tournament.Status.FINISHED
            tournament.finished_at = timezone.now()
            tournament.save(update_fields=["status", "finished_at"])
        else:
            tournament.current_stage += 1
            tournament.save(update_fields=["current_stage"])
        return Response(TournamentDetailSerializer(tournament, context={"request": request}).data)

    # ── finish ────────────────────────────────────────────────
    @action(detail=True, methods=["post"])
    def finish(self, request, pk=None):
        tournament = self.get_object()
        if tournament.creator != request.user:
            return Response({"error": "Только создатель"}, status=403)
        tournament.status = Tournament.Status.FINISHED
        tournament.finished_at = timezone.now()
        tournament.save(update_fields=["status", "finished_at"])
        return Response(TournamentDetailSerializer(tournament, context={"request": request}).data)

    # ── add_problem ───────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="add_problem")
    def add_problem(self, request, pk=None):
        tournament = self.get_object()
        if tournament.creator != request.user:
            return Response({"error": "Только создатель"}, status=403)
        if tournament.status != Tournament.Status.PENDING:
            return Response({"error": "Нельзя изменять запущенный турнир"}, status=400)
        problem_id = request.data.get("problem")
        stage = int(request.data.get("stage", 1))
        if not problem_id:
            return Response({"error": "Укажите задачу"}, status=400)
        tp, created = TournamentProblem.objects.get_or_create(
            tournament=tournament, problem_id=problem_id, stage=stage,
            defaults={"order": TournamentProblem.objects.filter(tournament=tournament, stage=stage).count()},
        )
        return Response(TournamentProblemSerializer(tp).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    # ── remove_problem ────────────────────────────────────────
    @action(detail=True, methods=["delete"], url_path=r"remove_problem/(?P<tp_id>[^/.]+)")
    def remove_problem(self, request, pk=None, tp_id=None):
        tournament = self.get_object()
        if tournament.creator != request.user:
            return Response({"error": "Только создатель"}, status=403)
        TournamentProblem.objects.filter(id=tp_id, tournament=tournament).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── leaderboard ───────────────────────────────────────────
    @action(detail=True, methods=["get"])
    def leaderboard(self, request, pk=None):
        tournament = self.get_object()
        qs = tournament.participants.select_related("user").order_by("-total_score")
        data = [
            {
                "id": str(p.id),
                "username": p.user.username,
                "total_score": p.total_score,
                "current_stage": p.current_stage,
            }
            for p in qs
        ]
        return Response(data)
