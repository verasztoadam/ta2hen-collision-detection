from django.urls import path

from . import views

urlpatterns = [
    path("upload", views.upload, name="upload"),
    path("datasets", views.get_datasets, name="datasets"),
]
