import { useEffect } from "react";
import BottomNav from "./components/BottomNav";
import Coach from "./pages/Coach";
import Home from "./pages/Home";
import Nutrition from "./pages/Nutrition";
import Profile from "./pages/Profile";
import Session from "./pages/Session";
import Welcome from "./pages/Welcome";
import Workouts from "./pages/Workouts";
import { useApp, useNav } from "./store";

export default function App() {
  const onboarded = useApp((s) => s.onboarded);
  const tab = useNav((s) => s.tab);
  const section = useNav((s) => s.section);
  const detailId = useNav((s) => s.detailId);
  const sessionId = useNav((s) => s.sessionId);

  // Each new screen starts at the top instead of keeping the previous screen's scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, section, detailId]);

  if (!onboarded) {
    return (
      <div className="mx-auto min-h-dvh max-w-[430px]">
        <Welcome />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[430px] pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
      {/* While a workout is running, the page underneath is hidden from screen readers. */}
      <div aria-hidden={sessionId ? true : undefined}>
        {tab === "home" && <Home />}
        {tab === "workouts" && <Workouts />}
        {tab === "nutrition" && <Nutrition />}
        {tab === "coach" && <Coach />}
        {tab === "profile" && <Profile />}
        <BottomNav />
      </div>
      {sessionId && <Session key={sessionId} />}
    </div>
  );
}
