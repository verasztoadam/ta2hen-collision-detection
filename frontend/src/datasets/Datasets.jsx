import { useEffect, useState, useCallback } from "react";
import "./Datasets.css"

import Settings from "../Settings"
import Dataset from "./dataset/Dataset";

function Datasets() {
    const [datasets, setDatasets] = useState([]);
    const fetchDatasetsCb = useCallback(fetchDatasets, []);

    useEffect(() => {
        fetchDatasetsCb();
    }, [fetchDatasetsCb]);

    function fetchDatasets() {
        fetch(Settings.BACKEND_URL + "/dataset/datasets").then((response) => {
            switch (response.status) {
                case 200:
                    response.json().then((data) => {
                        setDatasets(data["datasets"]);
                    }).catch((error) => alert(error));
                    break;

                default:
                    alert("Fetching datasets failed with response code: " + response.status);
                    break;
            }
        }).catch((error) => alert.error(error));
    }

    return (
        <div id="datasetsContainer">
            {datasets.map((data) => <Dataset key={data.id} data={data} />)}
        </div>
    );
}

export default Datasets