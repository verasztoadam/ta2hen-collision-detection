import json
import math

from celery import shared_task

from .models import DataSet, DataFrame


@shared_task
def process_data(dataset_id):
    dataset = DataSet.objects.get(pk=dataset_id)
    try:
        # ------------------------------------------------------------------
        # TODO: Remove
        # Mock data
        frames = []
        for i in range(1000):
            frames.append(
                DataFrame(
                    timestamp=i * 0.02,
                    dataset=dataset,
                    content=json.dumps({
                        "objects": [
                            {
                                "x": 5 * math.sin(math.pi / 2 * i * 0.02),
                                "y": 5 * math.cos(math.pi / 2 * i * 0.02),
                            }
                        ]
                    })
                )
            )
        # ------------------------------------------------------------------

        DataFrame.objects.bulk_create(frames)
        dataset.status = DataSet.STATUS_COMPLETED

    except Exception:
        dataset.status = DataSet.STATUS_FAILED

    dataset.save()
