import copy
import math

from .sensor_data import SensorData, Object


def predict(next_t: float, last_state: SensorData) -> SensorData:
    """Predict the state of the object at the given time"""
    """Car values in the stationary coordinate system"""
    dt = next_t - last_state.t
    vehicle_yaw = last_state.yaw_car
    vehicle_fi = last_state.yaw_car * dt
    vehicle_a = last_state.a_car
    vehicle_v = last_state.v_car + last_state.a_car * dt
    vehicle_d = last_state.v_car * dt + 0.5 * last_state.a_car * (dt ** 2)

    predicted_objects_list = []
    for obj in last_state.objects:
        if obj.is_detecting():
            """Object values in the stationary coordinate system"""
            object_ax = last_state.a_car + obj.ax
            object_ay = obj.ay
            object_vx = (last_state.v_car + obj.vx - last_state.yaw_car * obj.dy) + (last_state.a_car + obj.ax) * dt
            object_vy = (obj.vy + last_state.yaw_car * obj.dx) + obj.ay * dt
            object_dx = obj.dx + (obj.vx + last_state.v_car - last_state.yaw_car * obj.dy) * dt + 0.5 * (last_state.a_car + obj.ax) * (dt ** 2)
            object_dy = obj.dy + (obj.vy + last_state.yaw_car * obj.dx) * dt + 0.5 * obj.ay * (dt ** 2)

            """Calculate the relative values in the rotating coordinate system attached to the car (rotating but not rotated system)"""
            rel_ax = object_ax - vehicle_a
            rel_ay = object_ay
            rel_dx = object_dx - vehicle_d
            rel_dy = object_dy
            rel_vx = object_vx - last_state.v_car + rel_dy * last_state.yaw_car
            rel_vy = object_vy - rel_dx * last_state.yaw_car

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
        vehicle_a
    )


def estimate(measurement: SensorData, states: list[SensorData], detected: list[float]) -> SensorData:
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


def filter_data(sensor_datas: list[SensorData]) -> list[SensorData]:
    first_detected = sensor_datas[1].t
    last_detected = [first_detected, first_detected, first_detected, first_detected]
    calculated_sensor_datas = [sensor_datas[0], sensor_datas[1]]
    output_data = [sensor_datas[0], sensor_datas[1]]

    for i in range(2, len(sensor_datas)):
        estimation = estimate(sensor_datas[i], calculated_sensor_datas, last_detected)
        calculated_sensor_datas.append(estimation)
        for j in range(SensorData.NUM_OF_OBJECTS):
            if sensor_datas[i].objects[j].is_detecting():
                last_detected[j] = sensor_datas[i].t

        output_data.append(copy.deepcopy(estimation))

    return output_data
