from .models import DataFrame
import json


class Object:
    def __init__(self, dx: float = 0, dy: float = 0, vx: float = 0, vy: float = 0, ax: float = 0, ay: float = 0):
        self.dx = dx
        self.dy = dy
        self.vx = vx
        self.vy = vy
        self.ax = ax
        self.ay = ay

    def __str__(self):
        return "dx={0}, dy={1}, vx={2}, vy={3}, ax={4}, ay={5}".format(self.dx, self.dy, self.vx, self.vy, self.ax, self.ay)

    def dict(self):
        return {
            "dx": self.dx,
            "dy": self.dy,
            "vx": self.vx,
            "vy": self.vy,
            "ax": self.ax,
            "ay": self.ay,
        }

    def is_detecting(self):
        return self.dx or self.dy or self.vx or self.vy


class SensorData:
    NUM_OF_OBJECTS = 4

    def __init__(self, objects: list[Object], v_car: float, yaw_car: float, t: float, a_car: float = 0):
        self.objects = objects
        self.v_car = v_car
        self.a_car = a_car
        self.yaw_car = yaw_car
        self.t = t

    def __str__(self):
        ret = ""
        for i in range(self.NUM_OF_OBJECTS):
            ret += str(self.objects[i]) + "\n"
        ret += "v_car={0}, yaw_car={1}, t={2}".format(self.v_car, self.yaw_car, self.t)
        return ret

    def to_data_frame(self, dataset):
        return DataFrame(
            timestamp=self.t,
            dataset=dataset,
            content=json.dumps({
                "objects": list(map(lambda o: o.dict(), self.objects)),
                "v_car": self.v_car,
                "a_car": self.a_car,
                "yaw_car": self.yaw_car
            })
        )
