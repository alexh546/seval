# Generated by Django 2.1.7 on 2019-02-19 00:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0007_auto_20190219_0045'),
    ]

    operations = [
        migrations.AlterField(
            model_name='solve',
            name='correct',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
