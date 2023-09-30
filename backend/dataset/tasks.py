from celery import shared_task

from .data_loader import read_dataset
from .models import DataSet, DataFrame
from .data_filter import filter_data

@shared_task
def process_data(dataset_id):
    dataset = DataSet.objects.get(pk=dataset_id)
    try:
        filtered_data = filter_data(read_dataset(dataset.file.name))
        DataFrame.objects.bulk_create(list(map(lambda sensor_data: sensor_data.to_data_frame(dataset), filtered_data)))
        dataset.status = DataSet.STATUS_COMPLETED

    except Exception as e:
        print(e)
        dataset.status = DataSet.STATUS_FAILED

    dataset.save()
