import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tournaments", "0002_initial"),
        ("problems", "0003_testcase"),
    ]

    operations = [
        migrations.AddField(
            model_name="tournament",
            name="current_stage",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.CreateModel(
            name="TournamentProblem",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("stage", models.PositiveIntegerField()),
                ("order", models.PositiveIntegerField(default=0)),
                ("tournament", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="stage_problems",
                    to="tournaments.tournament",
                )),
                ("problem", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to="problems.problem",
                )),
            ],
            options={
                "ordering": ("stage", "order"),
                "unique_together": {("tournament", "problem", "stage")},
            },
        ),
    ]
