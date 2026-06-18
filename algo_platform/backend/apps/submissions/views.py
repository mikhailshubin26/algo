from rest_framework import permissions, viewsets

from apps.submissions.judge import run_submission
from apps.submissions.models import Submission
from apps.submissions.serializers import SubmissionSerializer
from apps.tournaments.services import recalculate_rating
from apps.tournaments.models import TournamentParticipant


class SubmissionViewSet(viewsets.ModelViewSet):
    """Создание и просмотр посылок. Пользователь видит только собственные
    посылки, администратор — все."""

    serializer_class = SubmissionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Submission.objects.all()
        if user.role != user.Role.ADMIN:
            queryset = queryset.filter(user=user)

        problem_id = self.request.query_params.get("problem")
        if problem_id:
            queryset = queryset.filter(problem_id=problem_id)

        return queryset

    def perform_create(self, serializer):
        submission = serializer.save(user=self.request.user)
        run_submission(submission)

        if submission.tournament_id:
            participant, _ = TournamentParticipant.objects.get_or_create(
                tournament=submission.tournament, user=submission.user
            )
            recalculate_rating(participant)
