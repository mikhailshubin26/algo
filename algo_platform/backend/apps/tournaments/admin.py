from django.contrib import admin

from apps.tournaments.models import Tournament, TournamentParticipant


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ("title", "creator", "status", "started_at", "finished_at")


@admin.register(TournamentParticipant)
class TournamentParticipantAdmin(admin.ModelAdmin):
    list_display = ("tournament", "user", "total_score", "current_stage")
