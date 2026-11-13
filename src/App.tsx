import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./state/store";
import { AppLayout } from "./components/Layout";

const LandingPage = lazy(() => import("./pages/Landing").then((m) => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const HomeworkSolverPage = lazy(() => import("./pages/HomeworkSolver").then((m) => ({ default: m.HomeworkSolverPage })));
const AITutorPage = lazy(() => import("./pages/AITutor").then((m) => ({ default: m.AITutorPage })));
const NotesPage = lazy(() => import("./pages/NotesPage").then((m) => ({ default: m.NotesPage })));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage").then((m) => ({ default: m.FlashcardsPage })));
const QuizPage = lazy(() => import("./pages/QuizPage").then((m) => ({ default: m.QuizPage })));
const RecordingPage = lazy(() => import("./pages/RecordingPage").then((m) => ({ default: m.RecordingPage })));
const StudyMaterialsPage = lazy(() => import("./pages/StudyMaterials").then((m) => ({ default: m.StudyMaterialsPage })));
const PracticeExamsPage = lazy(() => import("./pages/PracticeExams").then((m) => ({ default: m.PracticeExamsPage })));
const StudyGamesPage = lazy(() => import("./pages/StudyGames").then((m) => ({ default: m.StudyGamesPage })));
const CalendarPage = lazy(() => import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const ProgressPage = lazy(() => import("./pages/ProgressPage").then((m) => ({ default: m.ProgressPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-ink-400 dark:text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);
  if (!profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LandingGate() {
  const profile = useStore((s) => s.profile);
  if (profile) return <Navigate to="/app/home" replace />;
  return (
    <Suspense fallback={<Loading />}>
      <LandingPage />
    </Suspense>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingGate />} />
      <Route
        path="/app"
        element={
          <Gate>
            <AppLayout />
          </Gate>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<Suspense fallback={<Loading />}><DashboardPage /></Suspense>} />
        <Route path="homework" element={<Suspense fallback={<Loading />}><HomeworkSolverPage /></Suspense>} />
        <Route path="tutor" element={<Suspense fallback={<Loading />}><AITutorPage /></Suspense>} />
        <Route path="notes" element={<Suspense fallback={<Loading />}><NotesPage /></Suspense>} />
        <Route path="flashcards" element={<Suspense fallback={<Loading />}><FlashcardsPage /></Suspense>} />
        <Route path="quiz" element={<Suspense fallback={<Loading />}><QuizPage /></Suspense>} />
        <Route path="record" element={<Suspense fallback={<Loading />}><RecordingPage /></Suspense>} />
        <Route path="materials" element={<Suspense fallback={<Loading />}><StudyMaterialsPage /></Suspense>} />
        <Route path="exams" element={<Suspense fallback={<Loading />}><PracticeExamsPage /></Suspense>} />
        <Route path="games" element={<Suspense fallback={<Loading />}><StudyGamesPage /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<Loading />}><CalendarPage /></Suspense>} />
        <Route path="progress" element={<Suspense fallback={<Loading />}><ProgressPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Loading />}><SettingsPage /></Suspense>} />
        <Route path="more" element={<div />} />
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
