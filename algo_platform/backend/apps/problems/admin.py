from django.contrib import admin

from apps.problems.models import Problem, TestCase


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1
    fields = ("order", "input_data", "expected_output")


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "difficulty", "status", "total_tests", "created_at")
    list_filter = ("difficulty", "status")
    search_fields = ("title",)
    inlines = [TestCaseInline]
