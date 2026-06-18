from django.db.models import Q
from rest_framework import permissions, viewsets

from apps.messaging.models import Message
from apps.messaging.serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    """История переписки. Сообщения создаются преимущественно через
    WebSocket-консьюмер (см. ``apps.messaging.consumers``), REST API
    используется для загрузки истории диалога."""

    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.filter(Q(sender=user) | Q(receiver=user))

        with_user = self.request.query_params.get("with")
        if with_user:
            queryset = queryset.filter(
                Q(sender=user, receiver_id=with_user) | Q(sender_id=with_user, receiver=user)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
