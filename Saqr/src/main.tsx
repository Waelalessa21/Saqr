import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LandingPage } from "./components/landing/LandingPage";
import { SelectCategories } from "./components/select/SelectCategories";
import { TeamNames } from "./components/teams/TeamNames";
import { GameBoard } from "./components/game/GameBoard";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select" element={<SelectCategories />} />
        <Route path="/teams" element={<TeamNames />} />
        <Route path="/game" element={<GameBoard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
