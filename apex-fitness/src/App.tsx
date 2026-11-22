import BottomNav from "./components/BottomNav";
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
  const sessionId = useNav((s) => s.sessionId);

  if (!onboarded) {
    return (
      <div className="mx-auto min-h-screen max-w-[430px] bg-ink">
        <Welcome />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-ink pb-28">
      {tab === "home" && <Home />}
      {tab === "workouts" && <Workouts />}
      {tab === "nutrition" && <Nutrition />}
      {tab === "profile" && <Profile />}
      <BottomNav />
      {sessionId && <Session key={sessionId} />}
    </div>
  );
}
