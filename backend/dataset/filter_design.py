import pandas
import pandas as pd


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


class SensorData:
    NUM_OF_OBJECTS = 4

    def __init__(self, objects: list[Object], v_car: float, yaw_car: float, t: float, a_car: float = 0, beta: float = 0):
        self.objects = objects
        self.v_car = v_car
        self.a_car = a_car
        self.yaw_car = yaw_car
        self.beta = beta
        self.t = t

    def __str__(self):
        ret = ""
        for i in range(self.NUM_OF_OBJECTS):
            ret += str(self.objects[i]) + "\n"
        ret += "v_car={0}, yaw_car={1}, t={2}".format(self.v_car, self.yaw_car, self.t)
        return ret


def read_dataset(path) -> list[SensorData]:
    dataframe = pd.read_csv(path)

    sensor_data_list = []
    for _, row in dataframe.iterrows():
        """Retrieve the data of the objects"""
        objects = []
        for detected_object in range(SensorData.NUM_OF_OBJECTS):
            objects.append(Object(
                row.iloc[detected_object * 2 + 1] / 128.0,
                row.iloc[detected_object * 2 + 2] / 128.0,
                row.iloc[detected_object * 2 + 10] / 256.0,
                row.iloc[detected_object * 2 + 11] / 256.0
            ))

        sensor_data_list.append(SensorData(
            objects,
            row.iloc[9] / 256.0,
            row.iloc[18],
            row.iloc[19]
        ))

    return sensor_data_list


def predict(next_t: float, last_state: SensorData) -> SensorData:
    """Predict the state of the object at the given time"""
    """Car values in the stationary coordinate system"""
    dt = next_t - last_state.t
    vehicle_beta = last_state.beta
    vehicle_yaw = last_state.yaw_car + last_state.beta * dt
    vehicle_fi = last_state.yaw_car * dt + 0.5 * last_state.beta * (dt ** 2)
    vehicle_a = last_state.a_car
    vehicle_v = last_state.v_car + last_state.a_car * dt
    vehicle_d = last_state.v_car * dt + 0.5 * last_state.a_car * (dt ** 2)

    # """Object values in the stationary coordinate system"""
    # object_ax = vehicle_data.ax + self.ax
    # object_ay = vehicle_data.ay + self.ay
    # object_vx = (vehicle_data.vx + self.vx - vehicle_data.angular_speed * self.dy) + (vehicle_data.ax + self.ax) * dt
    # object_vy = (vehicle_data.vy + self.vy + vehicle_data.angular_speed * self.dx) + (vehicle_data.ay + self.ay) * dt
    # object_dx = (self.dx + (vehicle_data.vx + self.vx - vehicle_data.angular_speed * self.dy) * dt
    #              + 0.5 * (vehicle_data.ax + self.ax) * (dt ** 2))
    # object_dy = (self.dy + (vehicle_data.vy + self.vy + vehicle_data.angular_speed * self.dx) * dt
    #              + 0.5 * (vehicle_data.ay + self.ay) * (dt ** 2))
    #
    # """Calculate the relative values in the rotating coordinate system attached to the car (rotating but not rotated system)"""
    # rel_ax = object_ax - vehicle_ax
    # rel_ay = object_ay - vehicle_ay
    # rel_dx = object_dx - vehicle_dx
    # rel_dy = object_dy - vehicle_dy
    # rel_vx = object_vx - vehicle_vx + rel_dy * vehicle_data.angular_speed
    # rel_vy = object_vy - vehicle_vy - rel_dx * vehicle_data.angular_speed
    #
    # """Rotate the calculated values with -vehicle_fi"""
    # self.ax = math.cos(-vehicle_fi) * rel_ax - math.sin(-vehicle_fi) * rel_ay
    # self.ay = math.sin(-vehicle_fi) * rel_ax + math.cos(-vehicle_fi) * rel_ay
    # self.vx = math.cos(-vehicle_fi) * rel_vx - math.sin(-vehicle_fi) * rel_vy
    # self.vy = math.sin(-vehicle_fi) * rel_vx + math.cos(-vehicle_fi) * rel_vy
    # self.dx = math.cos(-vehicle_fi) * rel_dx - math.sin(-vehicle_fi) * rel_dy
    # self.dy = math.sin(-vehicle_fi) * rel_dx + math.cos(-vehicle_fi) * rel_dy
    #
    # self.t = next_t

    return SensorData(
        [],
        vehicle_v,
        vehicle_yaw,
        next_t,
        vehicle_a,
        vehicle_beta
    )


def estimate(prediction: SensorData, measurement: SensorData, states: list[SensorData]) -> SensorData:
    ALPHA = 0.9
    BETA = 0.05

    prediction_second_order = predict(measurement.t, states[-2])
    return SensorData(
        [],
        ALPHA * measurement.v_car + BETA * prediction.v_car + (1 - BETA - ALPHA) * prediction_second_order.v_car,
        ALPHA * measurement.yaw_car + BETA * prediction.yaw_car + (1 - BETA - ALPHA) * prediction_second_order.yaw_car,
        measurement.t,
        0,
        0
    )


if __name__ == "__main__":
    sensor_datas = read_dataset("../datasets/dev_data.csv")

    calculated_sensor_datas = [sensor_datas[0], sensor_datas[1]]
    predicted_sensor_datas = [sensor_datas[0], sensor_datas[1]]
    for i in range(2, len(sensor_datas)):
        predicted_sensor_datas.append(predict(sensor_datas[i].t, calculated_sensor_datas[-1]))
        calculated_sensor_datas.append(estimate(predicted_sensor_datas[-1], sensor_datas[i], calculated_sensor_datas))

    f = open("filter_output.csv", "w")
    f.write("{0},{1},{2},{3}\n".format("yaw", "est_yaw", "v", "est_v"))
    for i in range(len(sensor_datas)):
        f.write("{0},{1},{2},{3}\n".format(sensor_datas[i].yaw_car, predicted_sensor_datas[i].yaw_car, sensor_datas[i].v_car,
                                           predicted_sensor_datas[i].v_car))
    f.close()
