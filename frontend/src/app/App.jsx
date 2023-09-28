import 'bootstrap/dist/css/bootstrap.css';
import "./App.css"

import * as bootstraő from 'bootstrap'

import { lazy, useRef, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Component imports
const Header = lazy(() => import("../header/Header"));
const Upload = lazy(() => import("../upload/Upload"));
const Datasets = lazy(() => import("../datasets/Datasets"));
const Player = lazy(() => import("../player/Player"));

function App() {
  return (
    <BrowserRouter>
      <Header />
      <div id='contentContainer'>
        <Suspense fallback={<></>}>
          <Routes>
            <Route exact path="/upload" element={<Upload />} />
            <Route exact path="/datasets" element={<Datasets />} />
            <Route exact path="/player/:id" element={<Player />} />
            <Route path="*" element={<Navigate to="/upload" replace={true} />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter >
  );
}

export default App
