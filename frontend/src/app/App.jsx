import 'bootstrap/dist/css/bootstrap.css';
import "./App.css"

import { lazy, useRef, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Component imports
const Header = lazy(() => import("../header/Header"));
const Upload = lazy(() => import("../upload/Upload"));

function App() {
  return (
    <BrowserRouter>
      <Header />
      <div id='contentContainer'>
        <Suspense fallback={<></>}>
          <Routes>
            <Route exact path="/upload" element={<Upload />} />
            <Route path="/" element={<Navigate to="/upload" replace={true} />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter >
  );
}

export default App
