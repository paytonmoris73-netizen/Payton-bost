import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "./stores/appStore";
import { AppLayout } from "./components/layout/AppLayout";
import { OnboardingPage } from "./pages/Onboarding";
import { HomePage } from "./pages/Home";
import { AITutorPage } from "./pages/AITutor";
import { AudioStudioPage } from "./pages/AudioStudio";
import { TestCenterPage } from "./pages/TestCenter";
import { NotesStudioPage } from "./pages/NotesStudio";
import { FlashcardsPage } from "./pages/Flashcards";
import { SubjectsPage } from "./pages/Subjects";
import { LibraryPage } from "./pages/Library";
import { AnalyticsPage } from "./pages/Analytics";
import { PlannerPage } from "./pages/Planner";
import { StudyGuidesPage } from "./pages/StudyGuides";
import { GamesPage } from "./pages/Games";
import { VisualLearningPage } from "./pages/VisualLearning";
import { PresentationsPage } from "./pages/Presentations";
import { SearchPage } from "./pages/Search";
import { SettingsPage } from "./pages/Settings";

function Gate({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Landing() {
  const user = useAppStore((s) => s.user);
  if (user) return <Navigate to="/app/home" replace />;
  return <OnboardingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/app"
        element={
          <Gate>
            <AppLayout />
          </Gate>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="tutor" element={<AITutorPage />} />
        <Route path="audio" element={<AudioStudioPage />} />
        <Route path="tests" element={<TestCenterPage />} />
        <Route path="notes" element={<NotesStudioPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="guides" element={<StudyGuidesPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="visual" element={<VisualLearningPage />} />
        <Route path="presentations" element={<PresentationsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
