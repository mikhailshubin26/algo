from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("roadmaps", "0002_initial"),
        ("problems", "0003_testcase"),
    ]

    operations = [
        migrations.AddField(
            model_name="roadmapnode",
            name="problems",
            field=models.ManyToManyField(
                blank=True,
                related_name="roadmap_nodes",
                to="problems.problem",
            ),
        ),
    ]
