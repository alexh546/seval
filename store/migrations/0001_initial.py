# Generated by Django 2.1.7 on 2019-02-13 20:35

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Solve',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('picked', models.DateTimeField()),
                ('solved', models.DateTimeField()),
                ('response', models.CharField(max_length=255)),
                ('order', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('representation', models.TextField()),
                ('description', models.TextField()),
                ('key', models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='Tryout',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started', models.DateTimeField(blank=True, null=True)),
                ('completed', models.DateTimeField(blank=True, null=True)),
                ('session', models.CharField(blank=True, max_length=255, null=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='solve',
            name='task',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store.Task'),
        ),
        migrations.AddField(
            model_name='solve',
            name='tryout',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store.Tryout'),
        ),
    ]
