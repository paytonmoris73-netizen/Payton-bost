import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";

// Auth pages
import { WelcomePage } from "./pages/Welcome";
import { ParentRegisterPage } from "./pages/auth/ParentRegister";
import { ParentLoginPage } from "./pages/auth/ParentLogin";
import { ForgotPasswordPage } from "./pages/auth/ForgotPassword";
import { ProfileCreationPage } from "./pages/ProfileCreation";
import { ProfileSelectorPage } from "./pages/ProfileSelector";

// App pages
import { HomePage } from "./pages/app/Home";
import { ExplorePage } from "./pages/app/Explore";
import { ActivityDetailsPage } from "./pages/app/ActivityDetails";
import { ActivityPlayerPage } from "./pages/app/ActivityPlayer";
import { ActivityCompletePage } from "./pages/app/ActivityComplete";
import { AdventuresPage } from "./pages/app/Adventures";
import { AdventureWorldPage } from "./pages/app/AdventureWorld";
import { RewardsPage } from "./pages/app/Rewards";
import { RewardCollectionPage } from "./pages/app/RewardCollection";
import { AvatarCustomizePage } from "./pages/app/AvatarCustomize";
import { AchievementsPage } from "./pages/app/Achievements";
import { ProfilePage } from "./pages/app/Profile";

// Parent pages
import { ParentDashboardPage } from "./pages/parent/ParentDashboard";
import { FamilySettingsPage } from "./pages/parent/FamilySettings";
import { PrivacySettingsPage } from "./pages/parent/PrivacySettings";
import { NotificationSettingsPage } from "./pages/parent/NotificationSettings";
import { SubscriptionPage } from "./pages/parent/Subscription";
import { AccountSettingsPage } from "./pages/parent/AccountSettings";
import { SafetyInfoPage } from "./pages/parent/SafetyInfo";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.parent) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.parent) return <Navigate to="/" replace />;
  if (!state.activeProfileId) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<ParentRegisterPage />} />
      <Route path="/login" element={<ParentLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Auth required */}
      <Route path="/profiles" element={<RequireAuth><ProfileSelectorPage /></RequireAuth>} />
      <Route path="/profiles/create" element={<RequireAuth><ProfileCreationPage /></RequireAuth>} />

      {/* App (profile required) */}
      <Route path="/app/*" element={
        <RequireProfile>
          <AppLayout>
            <Routes>
              <Route path="home" element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="activity/:id" element={<ActivityDetailsPage />} />
              <Route path="activity/:id/play" element={<ActivityPlayerPage />} />
              <Route path="activity/:id/complete" element={<ActivityCompletePage />} />
              <Route path="adventures" element={<AdventuresPage />} />
              <Route path="adventure/:id" element={<AdventureWorldPage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="collection" element={<RewardCollectionPage />} />
              <Route path="avatar" element={<AvatarCustomizePage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </AppLayout>
        </RequireProfile>
      } />

      {/* Parent */}
      <Route path="/parent" element={<RequireAuth><ParentDashboardPage /></RequireAuth>} />
      <Route path="/parent/family-settings" element={<RequireAuth><FamilySettingsPage /></RequireAuth>} />
      <Route path="/parent/privacy" element={<RequireAuth><PrivacySettingsPage /></RequireAuth>} />
      <Route path="/parent/notifications" element={<RequireAuth><NotificationSettingsPage /></RequireAuth>} />
      <Route path="/parent/subscription" element={<RequireAuth><SubscriptionPage /></RequireAuth>} />
      <Route path="/parent/account" element={<RequireAuth><AccountSettingsPage /></RequireAuth>} />
      <Route path="/parent/safety" element={<RequireAuth><SafetyInfoPage /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
