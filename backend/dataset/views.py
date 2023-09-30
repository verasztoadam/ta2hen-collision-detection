import json

from django.http import HttpResponse, HttpRequest
from .models import DataSet, DataFrame
from .tasks import process_data


def upload(request: HttpRequest):
    if len(request.FILES) > 0:
        file = request.FILES["file"]
        dataset = DataSet.objects.create(name=file.name, file=file)
        process_data.delay(dataset.id)
        return HttpResponse("File uploaded")

    ret = HttpResponse("Invalid input")
    ret.status_code = 400
    return ret


def get_datasets(_: HttpRequest):
    return HttpResponse(json.dumps({"datasets": list(map(lambda dataset: dataset.dict(), DataSet.objects.all()))}))


def get_dataframes(_: HttpRequest, dataset_id: int):
    return HttpResponse(
        json.dumps({"dataframes": list(map(lambda dataframe: dataframe.dict(), DataFrame.objects.filter(dataset=dataset_id).order_by("timestamp")))}))
