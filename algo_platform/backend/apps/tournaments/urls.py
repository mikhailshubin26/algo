from rest_framework.routers import DefaultRouter

from apps.tournaments.views import TournamentViewSet

router = DefaultRouter()
router.register("", TournamentViewSet, basename="tournament")

urlpatterns = router.urls
