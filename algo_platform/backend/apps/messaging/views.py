from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.messaging.models import Message
from apps.messaging.serializers import MessageSerializer
from apps.users.models import User
from apps.users.serializers import UserBriefSerializer


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.select_related("sender", "receiver").filter(
            Q(sender=user) | Q(receiver=user)
        )
        with_user = self.request.query_params.get("with")
        if with_user:
            qs = qs.filter(
                Q(sender=user, receiver_id=with_user) | Q(sender_id=with_user, receiver=user)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["get"], url_path="conversations")
    def conversations(self, request):
        user = request.user
        sent_to = Message.objects.filter(sender=user).values_list("receiver_id", flat=True)
        received_from = Message.objects.filter(receiver=user).values_list("sender_id", flat=True)
        peer_ids = set(list(sent_to) + list(received_from))
        peers = User.objects.filter(id__in=peer_ids)
        return Response(UserBriefSerializer(peers, many=True).data)
