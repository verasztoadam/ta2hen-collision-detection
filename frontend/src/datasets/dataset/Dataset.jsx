import "./Dataset.css"
import { Link } from "react-router-dom";

function Dataset(props) {
    return (
        <div className="list-element-container">
            <div className="dataset-container">
                <div className="dataset-info-container">
                    <h4><b>Dataset id:</b> {props.data.id}</h4>
                    <div><b>File name:</b>  {props.data.name}</div>
                    <div><b>Processing:</b> {props.data.status}</div>
                </div>
                <div>
                    <Link className="btn btn-primary" to={"/player/" + props.data.id}>Load</ Link>
                </div>
            </div>

        </div>
    );
}

export default Dataset