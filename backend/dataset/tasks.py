import time

from celery import shared_task
from .models import DataSet


@shared_task
def process_data(dataset_id):
    dataset = DataSet.objects.get(pk=dataset_id)

    dataset.status = DataSet.STATUS_COMPLETED
    dataset.save()
