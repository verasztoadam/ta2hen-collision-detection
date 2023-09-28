import "./Player.css"

import { useParams } from "react-router-dom";
import Scene from '../scene/Scene'
import PlayerSceneRenderer from "../scene/renderer/player/PlayerRenderer";
import { useRef, useState, useCallback, useEffect } from "react";
import Settings from "../Settings";
import { render } from "react-dom";

function Player() {
    const rendererRef = useRef(null);
    let { id } = useParams();
    const [dataFrames, setDataFrames] = useState([]);
    const fetchDataFramesCb = useCallback(fetchDataFrames, []);

    useEffect(() => {
        fetchDataFramesCb();
    }, [fetchDataFramesCb]);

    useEffect(() => {
        if (dataFrames.length) {
            rendererRef.current = new PlayerSceneRenderer(dataFrames);
        }
    }, [dataFrames]);

    function fetchDataFrames() {
        fetch(Settings.BACKEND_URL + "/dataset/dataframes/" + id).then((response) => {
            switch (response.status) {
                case 200:
                    response.json().then((data) => {
                        setDataFrames(data["dataframes"]);
                    }).catch((error) => alert(error));
                    break;

                default:
                    alert("Fetching dataframes failed with response code: " + response.status);
                    break;
            }
        }).catch((error) => alert.error(error));
    }

    return (
        <div id="playerContainer">
            {rendererRef.current ? <Scene id="playerScene" renderer={rendererRef.current} /> : <></>}
        </div>
    );
}

export default Player