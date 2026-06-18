import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("problems", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="problem",
            name="test_file_path",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Путь к закрытому набору тестов (устарело)",
                max_length=512,
            ),
        ),
        migrations.AlterField(
            model_name="problem",
            name="total_tests",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="TestCase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("input_data", models.TextField(blank=True, default="")),
                ("expected_output", models.TextField()),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "problem",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="test_cases",
                        to="problems.problem",
                    ),
                ),
            ],
            options={"ordering": ("order",)},
        ),
    ]
