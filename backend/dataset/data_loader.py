import pandas as pd
from .sensor_data import SensorData, Object


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
