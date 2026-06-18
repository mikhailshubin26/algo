from rest_framework.routers import DefaultRouter

from apps.roadmaps.views import RoadmapNodeViewSet, RoadmapViewSet

router = DefaultRouter()
router.register("nodes", RoadmapNodeViewSet, basename="roadmap-node")
router.register("", RoadmapViewSet, basename="roadmap")

urlpatterns = router.urls
