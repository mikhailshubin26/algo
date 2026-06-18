from rest_framework import serializers

from apps.roadmaps.models import Roadmap, RoadmapNode


class RoadmapNodeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapNode
        fields = ("id", "roadmap", "parent", "title", "description", "position", "children")

    def get_children(self, obj):
        return RoadmapNodeSerializer(obj.children.all(), many=True).data


class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roadmap
        fields = ("id", "author", "title", "description", "is_public", "status", "created_at")
        read_only_fields = ("id", "author", "status", "created_at")


class RoadmapDetailSerializer(RoadmapSerializer):
    """Дорожная карта вместе с деревом узлов (только корневые узлы,
    дочерние возвращаются рекурсивно в поле ``children``)."""

    nodes = serializers.SerializerMethodField()

    class Meta(RoadmapSerializer.Meta):
        fields = RoadmapSerializer.Meta.fields + ("nodes",)

    def get_nodes(self, obj):
        roots = obj.nodes.filter(parent__isnull=True)
        return RoadmapNodeSerializer(roots, many=True).data
