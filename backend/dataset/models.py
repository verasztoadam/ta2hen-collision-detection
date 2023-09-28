from django.db import models


class DataSet(models.Model):
    STATUS_IN_PROGRESS = "In progress"
    STATUS_FAILED = "Failed"
    STATUS_COMPLETED = "Completed"

    name = models.CharField(default="")
    file = models.FileField(upload_to="./datasets")
    status = models.CharField(default=STATUS_IN_PROGRESS)

    def dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status
        }


class DataFrame:
    timestamp = models.FloatField()
    content = models.CharField()

    def dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "content": self.content
        }
