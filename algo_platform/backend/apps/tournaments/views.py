from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.tournaments.models import Tournament, TournamentParticipant
from apps.tournaments.serializers import TournamentParticipantSerializer, TournamentSerializer


class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """Регистрация текущего пользователя на турнир (создание записи
        в таблице ``tournament_participants``)."""

        tournament = self.get_object()
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=request.user
        )
        serializer = TournamentParticipantSerializer(participant)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def leaderboard(self, request, pk=None):
        tournament = self.get_object()
        participants = tournament.participants.order_by("-total_score")
        serializer = TournamentParticipantSerializer(participants, many=True)
        return Response(serializer.data)
