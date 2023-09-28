import Settings from "../Settings";
import "./Header.css"

import { Link } from "react-router-dom";

function Header() {

  return (
    <nav className="header-nav navbar navbar-expand-sm fixed-top navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand">Collision Detection</span>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" to="/upload">Upload dataset</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav >
  );
}

export default Header;
