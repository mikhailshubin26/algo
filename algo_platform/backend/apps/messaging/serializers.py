from rest_framework import serializers

from apps.messaging.models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "sender", "receiver", "content", "is_read", "sent_at")
        read_only_fields = ("id", "sender", "is_read", "sent_at")
