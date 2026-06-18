from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.serializers import RegisterSerializer, UserBriefSerializer, UserSerializer
from apps.users.services import register_activity


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        register_activity(request.user)
        return Response(UserSerializer(request.user).data)


class UserSearchView(generics.ListAPIView):
    serializer_class = UserBriefSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if len(q) < 1:
            return User.objects.none()
        return (
            User.objects.filter(username__icontains=q)
            .exclude(id=self.request.user.id)[:10]
        )
