from rest_framework import serializers

from apps.problems.models import Problem, TestCase


class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ("id", "input_data", "expected_output", "order")


class ProblemListSerializer(serializers.ModelSerializer):
    """Краткое представление задачи для списков и карточек."""

    class Meta:
        model = Problem
        fields = ("id", "title", "difficulty", "status", "created_at")


class ProblemDetailSerializer(serializers.ModelSerializer):
    """Полное представление задачи с тест-кейсами."""

    test_cases = TestCaseSerializer(many=True, required=False)

    class Meta:
        model = Problem
        fields = (
            "id",
            "author",
            "title",
            "description",
            "constraints",
            "difficulty",
            "total_tests",
            "time_limit_ms",
            "memory_limit_mb",
            "status",
            "created_at",
            "updated_at",
            "test_cases",
        )
        read_only_fields = ("id", "author", "total_tests", "created_at", "updated_at")

    def create(self, validated_data):
        test_cases = validated_data.pop("test_cases", [])
        problem = Problem.objects.create(**validated_data)
        for i, tc in enumerate(test_cases):
            tc.setdefault("order", i)
            TestCase.objects.create(problem=problem, **tc)
        problem.total_tests = len(test_cases)
        problem.save(update_fields=["total_tests"])
        return problem

    def update(self, instance, validated_data):
        test_cases = validated_data.pop("test_cases", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if test_cases is not None:
            instance.test_cases.all().delete()
            for i, tc in enumerate(test_cases):
                tc.setdefault("order", i)
                TestCase.objects.create(problem=instance, **tc)
            instance.total_tests = len(test_cases)
            instance.save(update_fields=["total_tests"])
        return instance
