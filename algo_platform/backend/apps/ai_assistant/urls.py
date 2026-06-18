from django.urls import path

from apps.ai_assistant.views import AskAssistantView

urlpatterns = [
    path("ask/", AskAssistantView.as_view(), name="ai-assistant-ask"),
]
