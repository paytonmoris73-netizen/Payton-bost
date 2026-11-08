import type { ReactNode } from "react";
import { BottomNav } from "./navigation/BottomNav";
import { Sidebar } from "./navigation/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950 lg:pl-64">
      <Sidebar />
      <main className="min-h-screen">{children}</main>
      <BottomNav />
    </div>
  );
}
