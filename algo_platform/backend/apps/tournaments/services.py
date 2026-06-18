from apps.submissions.models import Submission
from apps.tournaments.models import TournamentParticipant


def submission_score(submission: Submission) -> float:
    """Балл за решение задачи в рамках турнира (формула 2.1):

    S = T_passed / T_total * 100
    """

    if submission.problem.total_tests == 0:
        return 0.0
    return submission.tests_passed / submission.problem.total_tests * 100


def recalculate_rating(participant: TournamentParticipant) -> TournamentParticipant:
    """Итоговый турнирный рейтинг участника (формула 2.2):

    R = sum(S_j) по всем задачам, по которым отправлено решение.

    Для каждой задачи берётся лучшая (максимальная) посылка участника.
    """

    submissions = Submission.objects.filter(
        tournament=participant.tournament, user=participant.user
    )

    best_score_per_problem: dict = {}
    for submission in submissions:
        score = submission_score(submission)
        best_score_per_problem[submission.problem_id] = max(
            best_score_per_problem.get(submission.problem_id, 0), score
        )

    participant.total_score = round(sum(best_score_per_problem.values()))
    participant.save(update_fields=["total_score"])
    return participant
