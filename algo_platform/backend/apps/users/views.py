from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.serializers import RegisterSerializer, UserSerializer
from apps.users.services import register_activity


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(APIView):
    """Возвращает профиль текущего пользователя и обновляет его серию
    активных дней (streak)."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        register_activity(request.user)
        return Response(UserSerializer(request.user).data)
