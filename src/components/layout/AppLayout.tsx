import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MiniPlayer } from "../audio/MiniPlayer";
import { ToastContainer } from "../ui/Toast";

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-dvh">
      <Sidebar />

      <div className="min-w-0 flex-1 pb-20 lg:pb-6">
        <div key={location.pathname} className="animate-fade-in px-4 pt-5 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>

      <MiniPlayer />
      <MobileNav />
      <ToastContainer />
    </div>
  );
}
