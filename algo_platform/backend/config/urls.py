from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/users/", include("apps.users.urls")),
    path("api/problems/", include("apps.problems.urls")),
    path("api/submissions/", include("apps.submissions.urls")),
    path("api/roadmaps/", include("apps.roadmaps.urls")),
    path("api/tournaments/", include("apps.tournaments.urls")),
    path("api/messages/", include("apps.messaging.urls")),
    path("api/ai-assistant/", include("apps.ai_assistant.urls")),
]
