from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_assistant.services import ask_assistant
from apps.problems.models import Problem
from apps.users.permissions import IsPremium


class AskAssistantView(APIView):
    """POST {"problem": <uuid>, "question": "...", "code": "..."}

    Доступно только премиум-пользователям и администраторам.
    """

    permission_classes = (IsPremium,)

    def post(self, request):
        problem = Problem.objects.get(pk=request.data["problem"])
        answer = ask_assistant(
            problem_description=problem.description,
            user_code=request.data.get("code"),
            question=request.data["question"],
        )
        return Response({"answer": answer})
