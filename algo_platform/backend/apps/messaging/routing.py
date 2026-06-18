from django.urls import re_path

from apps.messaging.consumers import ChatConsumer, InboxConsumer

websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<user_id>[0-9a-f-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"^ws/inbox/$", InboxConsumer.as_asgi()),
]
