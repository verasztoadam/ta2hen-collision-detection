import copy
import math

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

    def is_detecting(self):
        return self.dx or self.dy or self.vx or self.vy


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

    predicted_objects_list = []
    for obj in last_state.objects:
        if obj.is_detecting():

            """Object values in the stationary coordinate system"""
            object_ax = obj.ax
            object_ay = last_state.a_car + obj.ay
            object_vx = (obj.vx - last_state.yaw_car * obj.dy) + obj.ax * dt
            object_vy = (last_state.v_car + obj.vy + last_state.yaw_car * obj.dx) + (last_state.a_car + obj.ay) * dt
            object_dx = obj.dx + (obj.vx - last_state.yaw_car * obj.dy) * dt + 0.5 * obj.ax * (dt ** 2)
            object_dy = obj.dy + (last_state.a_car + obj.vy + last_state.yaw_car * obj.dx) * dt + 0.5 * (last_state.a_car + obj.ay) * (dt ** 2)

            """Calculate the relative values in the rotating coordinate system attached to the car (rotating but not rotated system)"""
            rel_ax = object_ax
            rel_ay = object_ay - vehicle_a
            rel_dx = object_dx
            rel_dy = object_dy - vehicle_d
            rel_vx = object_vx + rel_dy * last_state.yaw_car
            rel_vy = object_vy - last_state.v_car - rel_dx * last_state.yaw_car

            """Rotate the calculated values with -vehicle_fi"""
            ax = math.cos(-vehicle_fi) * rel_ax - math.sin(-vehicle_fi) * rel_ay
            ay = math.sin(-vehicle_fi) * rel_ax + math.cos(-vehicle_fi) * rel_ay
            vx = math.cos(-vehicle_fi) * rel_vx - math.sin(-vehicle_fi) * rel_vy
            vy = math.sin(-vehicle_fi) * rel_vx + math.cos(-vehicle_fi) * rel_vy
            dx = math.cos(-vehicle_fi) * rel_dx - math.sin(-vehicle_fi) * rel_dy
            dy = math.sin(-vehicle_fi) * rel_dx + math.cos(-vehicle_fi) * rel_dy

            predicted_objects_list.append(Object(
                dx,
                dy,
                vx,
                vy,
                ax,
                ay
            ))
        else:
            predicted_objects_list.append(obj)

    return SensorData(
        predicted_objects_list,
        vehicle_v,
        vehicle_yaw,
        next_t,
        vehicle_a,
        vehicle_beta
    )


def estimate(measurement: SensorData, states: list[SensorData], detected: list[float], x) -> SensorData:
    ALPHA = 0.50
    BETA = 0.33
    DEADTIME = 1  # sec
    DEADDISTANCE = 3

    prediction = predict(measurement.t, states[-1])
    prediction_second_order = predict(measurement.t, states[-2])

    estimated_objects = []
    for o in range(SensorData.NUM_OF_OBJECTS):
        if states[-1].objects[o].is_detecting():
            if measurement.objects[o].is_detecting():
                if detected[o] == states[-1].t:
                    sp = prediction_second_order
                    if not prediction_second_order.objects[o].is_detecting():
                        sp = prediction
                    estimated_objects.append(Object(
                        ALPHA * measurement.objects[o].dx + BETA * prediction.objects[o].dx + (1 - BETA - ALPHA) * sp.objects[o].dx,
                        ALPHA * measurement.objects[o].dy + BETA * prediction.objects[o].dy + (1 - BETA - ALPHA) * sp.objects[o].dy,
                        ALPHA * measurement.objects[o].vx + BETA * prediction.objects[o].vx + (1 - BETA - ALPHA) * sp.objects[o].vx,
                        ALPHA * measurement.objects[o].vy + BETA * prediction.objects[o].vy + (1 - BETA - ALPHA) * sp.objects[o].vy,
                        ALPHA * measurement.objects[o].ax + BETA * prediction.objects[o].ax + (1 - BETA - ALPHA) * sp.objects[o].ax,
                        ALPHA * measurement.objects[o].ay + BETA * prediction.objects[o].ay + (1 - BETA - ALPHA) * sp.objects[o].ay,
                    ))
                else:
                    if (prediction.objects[o].dx - measurement.objects[o].dx) ** 2 + (
                            prediction.objects[o].dy - measurement.objects[o].dy) ** 2 > DEADDISTANCE ** 2:
                        states[-1].objects[o] = measurement.objects[o]
                        estimated_objects.append(measurement.objects[o])
                    else:
                        sp = prediction_second_order
                        if not prediction_second_order.objects[o].is_detecting():
                            sp = prediction
                        estimated_objects.append(Object(
                            ALPHA * measurement.objects[o].dx + BETA * prediction.objects[o].dx + (1 - BETA - ALPHA) * sp.objects[o].dx,
                            ALPHA * measurement.objects[o].dy + BETA * prediction.objects[o].dy + (1 - BETA - ALPHA) * sp.objects[o].dy,
                            ALPHA * measurement.objects[o].vx + BETA * prediction.objects[o].vx + (1 - BETA - ALPHA) * sp.objects[o].vx,
                            ALPHA * measurement.objects[o].vy + BETA * prediction.objects[o].vy + (1 - BETA - ALPHA) * sp.objects[o].vy,
                            ALPHA * measurement.objects[o].ax + BETA * prediction.objects[o].ax + (1 - BETA - ALPHA) * sp.objects[o].ax,
                            ALPHA * measurement.objects[o].ay + BETA * prediction.objects[o].ay + (1 - BETA - ALPHA) * sp.objects[o].ay,
                        ))
            else:
                if detected[o] + DEADTIME < measurement.t:
                    states[-1].objects[o] = Object()
                    estimated_objects.append(Object())
                else:
                    estimated_objects.append(prediction.objects[0])
        else:
            estimated_objects.append(measurement.objects[o])

    return SensorData(
        estimated_objects,
        ALPHA * measurement.v_car + BETA * prediction.v_car + (1 - BETA - ALPHA) * prediction_second_order.v_car,
        ALPHA * measurement.yaw_car + BETA * prediction.yaw_car + (1 - BETA - ALPHA) * prediction_second_order.yaw_car,
        measurement.t
    )


if __name__ == "__main__":
    sensor_datas = read_dataset("../datasets/dev_data.csv")

    first_detected = sensor_datas[1].t
    last_detected = [first_detected, first_detected, first_detected, first_detected]
    calculated_sensor_datas = [sensor_datas[0], sensor_datas[1]]
    output_data = [sensor_datas[0], sensor_datas[1]]
    for i in range(2, len(sensor_datas)):
        estimation = estimate(sensor_datas[i], calculated_sensor_datas, last_detected, i)
        calculated_sensor_datas.append(estimation)
        output_data.append(copy.deepcopy(estimation))
        for j in range(SensorData.NUM_OF_OBJECTS):
            if sensor_datas[i].objects[j].is_detecting():
                last_detected[j] = sensor_datas[i].t

    f = open("filter_output.csv", "w")
    f.write("{0},{1},{2},{3},{4},{5},{6},{7}\n".format("obj1x", "obj1y", "obj1vx", "obj1vy", "obj1x_est", "obj1y_est", "obj1vx_est", "obj1vy_est"))
    for i in range(len(sensor_datas)):
        f.write(
            "{0},{1},{2},{3},{4},{5},{6},{7}\n".format(sensor_datas[i].objects[0].dx, sensor_datas[i].objects[0].dy, sensor_datas[i].objects[0].vx,
                                                       sensor_datas[i].objects[0].vy, output_data[i].objects[0].dx, output_data[i].objects[0].dy,
                                                       output_data[i].objects[0].vx, output_data[i].objects[0].vy))
    f.close()
