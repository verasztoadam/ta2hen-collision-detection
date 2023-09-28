import "./Player.css"

import { useParams } from "react-router-dom";
import Scene from '../scene/Scene'
import PlayerSceneRenderer from "../scene/renderer/player/PlayerRenderer";
import { useRef } from "react";

function Player() {
    const rendererRef = useRef(new PlayerSceneRenderer());
    let { id } = useParams();

    return (
        <div id="playerContainer">
            <Scene id="playerScene" renderer={rendererRef.current} />
        </div>
    );
}

export default Player