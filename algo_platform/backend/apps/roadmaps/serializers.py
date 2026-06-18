from rest_framework import serializers

from apps.problems.models import Problem
from apps.roadmaps.models import Roadmap, RoadmapNode


class RoadmapNodeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    problems = serializers.SerializerMethodField()
    problem_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        source="problems",
        queryset=Problem.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = RoadmapNode
        fields = (
            "id", "roadmap", "parent", "title", "description",
            "position", "problem_ids", "problems", "children",
        )

    def get_children(self, obj):
        return RoadmapNodeSerializer(obj.children.all(), many=True).data

    def get_problems(self, obj):
        return [{"id": p.id, "title": p.title} for p in obj.problems.all()]


class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roadmap
        fields = ("id", "author", "title", "description", "is_public", "status", "created_at")
        read_only_fields = ("id", "author", "status", "created_at")


class RoadmapDetailSerializer(RoadmapSerializer):
    nodes = serializers.SerializerMethodField()

    class Meta(RoadmapSerializer.Meta):
        fields = RoadmapSerializer.Meta.fields + ("nodes",)

    def get_nodes(self, obj):
        roots = obj.nodes.filter(parent__isnull=True)
        return RoadmapNodeSerializer(roots, many=True).data
