import { Navigate, Route, Routes } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { RecipePage } from "./pages/RecipePage";
import { StarterPackPage } from "./pages/StarterPackPage";
import { TrackPage } from "./pages/TrackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tracks/:trackId" element={<TrackPage />} />
      <Route path="/recipes/:slug" element={<RecipePage />} />
      <Route path="/starter-pack" element={<StarterPackPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
