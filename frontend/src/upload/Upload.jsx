import "./Upload.css"

import Settings from "../Settings";

function Upload() {
    function submit(e) {
        e.preventDefault();
        fetch(Settings.BACKEND_URL + '/dataset/upload', {
            method: 'POST',
            body: new FormData(document.getElementById('datasetUploadForm')),
        }).then((response) => {
            switch (response.status) {
                case 200:
                    alert("Upload successful");
                    break;

                default:
                    alert("Upload failed with status code: " + response.status);
                    break;
            }
        }).catch((error) => {
            alert(error);
        });
    }

    return (
        <div id="uploadContainer">
            <form id="datasetUploadForm" className="input-group">
                <input type="file" className="form-control" aria-label="Upload" name="file" accept=".csv" />
                <button className="btn btn-primary" type="submit" onClick={submit}>Upload</button>
            </form>
        </div>
    );
}

export default Upload;