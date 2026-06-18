from django.contrib import admin

from apps.roadmaps.models import Roadmap, RoadmapNode


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "is_public", "status", "created_at")


@admin.register(RoadmapNode)
class RoadmapNodeAdmin(admin.ModelAdmin):
    list_display = ("title", "roadmap", "parent", "position")
