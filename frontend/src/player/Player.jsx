import { useParams } from "react-router-dom";

function Player() {
    let { id } = useParams();

    return (
        <div>{id}</div>
    );
}

export default Player