import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LandingPage } from "./components/landing/LandingPage";
import { SelectCategories } from "./components/select/SelectCategories";
import { TeamNames } from "./components/teams/TeamNames";
import { GameBoard } from "./components/game/GameBoard";
import { AdminGames } from "./components/admin/AdminGames";
import { AdminGameDetail } from "./components/admin/AdminGameDetail";
import { ProfilePage } from "./components/profile/ProfilePage";
import { AuthGuard, AdminGuard } from "./components/shared/AuthGuard";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select" element={<AuthGuard><SelectCategories /></AuthGuard>} />
        <Route path="/teams" element={<AuthGuard><TeamNames /></AuthGuard>} />
        <Route path="/game" element={<AuthGuard><GameBoard /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
        <Route path="/admin" element={<AdminGuard><AdminGames /></AdminGuard>} />
        <Route path="/admin/games/:gameId" element={<AdminGuard><AdminGameDetail /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
