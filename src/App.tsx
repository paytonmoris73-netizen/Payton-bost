import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./state/AppContext";
import { AppLayout } from "./components/Layout";
import { ToastStack } from "./components/ui";
import { OnboardingPage } from "./pages/Onboarding";
import { HomePage } from "./pages/Home";
import { WorkoutsPage } from "./pages/Workouts";
import { WorkoutDetailPage } from "./pages/WorkoutDetail";
import { PlayerPage } from "./pages/Player";
import { ProgressPage } from "./pages/Progress";
import { RewardsPage } from "./pages/Rewards";
import { CommunityPage } from "./pages/Community";
import { StorePage } from "./pages/Store";
import { PlanPage } from "./pages/Plan";
import { SettingsPage } from "./pages/Settings";

function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Landing() {
  const { state } = useApp();
  if (state.profile) return <Navigate to="/app/home" replace />;
  return <OnboardingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Immersive player (no app chrome) */}
      <Route
        path="/app/play/:id"
        element={
          <Gate>
            <ToastStack />
            <PlayerPage />
          </Gate>
        }
      />

      {/* Main app */}
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
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="workouts/:id" element={<WorkoutDetailPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
