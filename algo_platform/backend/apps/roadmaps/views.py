from rest_framework import permissions, viewsets

from apps.roadmaps.models import Roadmap, RoadmapNode
from apps.roadmaps.serializers import (
    RoadmapDetailSerializer,
    RoadmapNodeSerializer,
    RoadmapSerializer,
)
from apps.users.permissions import IsAuthorOrReadOnly


class RoadmapViewSet(viewsets.ModelViewSet):
    queryset = Roadmap.objects.filter(status=Roadmap.Status.ACTIVE)
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return RoadmapDetailSerializer
        return RoadmapSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.filter(is_public=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        instance.status = Roadmap.Status.DELETED
        instance.save(update_fields=["status"])


class RoadmapNodeViewSet(viewsets.ModelViewSet):
    queryset = RoadmapNode.objects.all()
    serializer_class = RoadmapNodeSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        queryset = super().get_queryset()
        roadmap_id = self.request.query_params.get("roadmap")
        if roadmap_id:
            queryset = queryset.filter(roadmap_id=roadmap_id)
        return queryset
