import { useCallback, useEffect, useState } from "react";
import { api, auth } from "./lib/api";
import type { User, UserWithStats, Page } from "./lib/types";
import { SetupPage } from "./pages/SetupPage";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { TeamPage } from "./pages/TeamPage";
import { TimePage } from "./pages/TimePage";
import { PayrollPage } from "./pages/PayrollPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { MyTimePage } from "./pages/MyTimePage";
import { MyPayPage } from "./pages/MyPayPage";
import { JobsPage } from "./pages/JobsPage";
import { MyJobsPage } from "./pages/MyJobsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { MyPaymentsPage } from "./pages/MyPaymentsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { BillingPage } from "./pages/BillingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ActivityPage } from "./pages/ActivityPage";
import { SchedulePage } from "./pages/SchedulePage";
import { MySchedulePage } from "./pages/MySchedulePage";
import { LeavePage } from "./pages/LeavePage";
import { TasksPage } from "./pages/TasksPage";
import { ClientsPage } from "./pages/ClientsPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ChatPage } from "./pages/ChatPage";
import { ToastProvider } from "./contexts/Toast";

// On first load, auto-detect OS dark mode if user hasn't set a preference yet
if (!localStorage.getItem("theme")) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  localStorage.setItem("theme", prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("owner-dashboard");

  useEffect(() => {
    auth.onUnauthorized(() => setUser(null));
    init();
  }, []);

  async function init() {
    try {
      const status = await api.getStatus();
      setIsSetup(status.setup);
      if (status.setup) {
        localStorage.removeItem("workbase_uid");
        if (auth.getToken()) {
          try {
            const me = await api.authMe();
            setUser(me);
            setPage(me.role === "owner" ? "owner-dashboard" : "employee-dashboard");
          } catch {
            auth.clear();
          }
        }
      }
    } catch {/* server unavailable */}
    finally { setLoading(false); }
  }

  function handleLogin(u: User, token: string) {
    auth.clear();
    auth.setToken(token);
    setUser(u);
    setPage(u.role === "owner" ? "owner-dashboard" : "employee-dashboard");
  }

  function handleLogout() {
    api.logout().catch(() => {});
    auth.clear();
    setUser(null);
  }

  function handleSetupDone(owner: User, token: string) {
    setIsSetup(true);
    handleLogin(owner, token);
  }

  const handleUserUpdate = useCallback((updated: UserWithStats) => {
    setUser(updated);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!isSetup) return <ToastProvider><SetupPage onSetup={handleSetupDone} /></ToastProvider>;
  if (!user) return <ToastProvider><LoginPage onLogin={handleLogin} /></ToastProvider>;

  return (
    <ToastProvider>
    <Layout user={user} page={page} onNavigate={setPage} onLogout={handleLogout}>
      {page === "owner-dashboard" && <OwnerDashboard user={user} onNavigate={setPage} />}
      {page === "owner-activity" && <ActivityPage />}
      {page === "owner-schedule" && <SchedulePage />}
      {page === "owner-leave" && <LeavePage user={user} />}
      {page === "owner-tasks" && <TasksPage user={user} />}
      {page === "owner-clients" && <ClientsPage />}
      {page === "owner-invoices" && <InvoicesPage />}
      {page === "employee-tasks" && <TasksPage user={user} />}
      {page === "owner-reports" && <ReportsPage />}
      {(page === "owner-chat" || page === "employee-chat") && <ChatPage user={user} />}
      {page === "owner-team" && <TeamPage user={user} onUserUpdate={setUser} />}
      {page === "owner-time" && <TimePage user={user} />}
      {page === "owner-payroll" && <PayrollPage />}
      {page === "owner-jobs" && <JobsPage />}
      {page === "owner-payments" && <PaymentsPage />}
      {page === "owner-analytics" && <AnalyticsPage />}
      {page === "employee-dashboard" && <EmployeeDashboard user={user} onUserUpdate={handleUserUpdate} />}
      {page === "employee-schedule" && <MySchedulePage user={user} />}
      {page === "employee-leave" && <LeavePage user={user} />}
      {page === "employee-time" && <MyTimePage user={user} />}
      {page === "employee-pay" && <MyPayPage user={user} />}
      {page === "owner-expenses" && <ExpensesPage />}
      {page === "owner-announcements" && <AnnouncementsPage user={user} />}
      {page === "employee-jobs" && <MyJobsPage user={user} />}
      {page === "employee-payments" && <MyPaymentsPage user={user} />}
      {page === "employee-announcements" && <AnnouncementsPage user={user} />}
      {page === "owner-billing" && <BillingPage />}
      {page === "owner-settings" && <SettingsPage />}
    </Layout>
    </ToastProvider>
  );
}
