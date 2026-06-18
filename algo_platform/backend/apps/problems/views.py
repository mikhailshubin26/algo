from rest_framework import permissions, viewsets

from apps.problems.models import Problem
from apps.problems.serializers import ProblemDetailSerializer, ProblemListSerializer
from apps.users.permissions import IsAuthorOrReadOnly


class ProblemViewSet(viewsets.ModelViewSet):
    """CRUD для задач. Создавать задачи может любой авторизованный
    пользователь, редактировать и удалять — только автор или администратор."""

    queryset = Problem.objects.filter(status=Problem.Status.ACTIVE)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly)

    def get_serializer_class(self):
        if self.action == "list":
            return ProblemListSerializer
        return ProblemDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        # Мягкое удаление: задача помечается как удалённая, а не стирается,
        # чтобы сохранить ссылочную целостность с посылками (submissions).
        instance.status = Problem.Status.DELETED
        instance.save(update_fields=["status"])
