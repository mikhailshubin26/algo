from rest_framework.routers import DefaultRouter

from apps.messaging.views import MessageViewSet

router = DefaultRouter()
router.register("", MessageViewSet, basename="message")

urlpatterns = router.urls
