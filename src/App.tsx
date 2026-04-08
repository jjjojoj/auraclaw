import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "./components/AdminGate";
import { AboutPage } from "./pages/AboutPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { HomePage } from "./pages/HomePage";
import { RecipePage } from "./pages/RecipePage";
import { ReviewPage } from "./pages/ReviewPage";
import { SourceIndexPage } from "./pages/SourceIndexPage";
import { StarterPackPage } from "./pages/StarterPackPage";
import { TrackPage } from "./pages/TrackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tracks/:trackId" element={<TrackPage />} />
      <Route path="/recipes/:slug" element={<RecipePage />} />
      <Route path="/starter-pack" element={<StarterPackPage />} />
      <Route path="/sources" element={<SourceIndexPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminGate />}>
        <Route path="/admin/review" element={<ReviewPage />} />
      </Route>
      <Route path="/review" element={<Navigate to="/admin/login" replace />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
