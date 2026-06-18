import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.messaging.models import Message


class ChatConsumer(AsyncWebsocketConsumer):
    """Канал личных сообщений между двумя пользователями.

    Группа канала формируется из идентификаторов обоих участников
    (отсортированных), поэтому оба пользователя подключаются к одной
    и той же группе и получают сообщения в реальном времени.
    """

    async def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        self.other_user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.room_group_name = "chat_" + "_".join(
            sorted([str(user.id), str(self.other_user_id)])
        )

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data["content"]
        user = self.scope["user"]

        message = await self._save_message(user.id, self.other_user_id, content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "id": str(message.id),
                "sender_id": str(message.sender_id),
                "content": message.content,
                "sent_at": message.sent_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _save_message(self, sender_id, receiver_id, content):
        return Message.objects.create(
            sender_id=sender_id, receiver_id=receiver_id, content=content
        )
