from django.http import HttpResponse, HttpRequest
from .models import DataSet
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
