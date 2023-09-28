# Generated by Django 4.2.4 on 2023-09-28 06:40

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DataSet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='')),
                ('file', models.FileField(upload_to='./datasets')),
                ('status', models.CharField(default='In progress')),
            ],
        ),
    ]
