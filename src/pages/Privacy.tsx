import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

/** Public page. Describes what THIS build actually does. Update it when a real backend is connected. */
const SECTIONS: { title: string; items: string[] }[] = [
  { title: "What CRUNCH stores", items: [
    "Your account details (name, email, birth year, preferences), recipes, cookbook, shopping lists, messages, posts and settings.",
    "In this version all of that is stored in your own browser (local storage) on your device. Passwords are salted and hashed before being stored; we never store your password in plain text.",
    "We don't use advertising trackers, sell your data, or build advertising profiles." ] },
  { title: "AI Chef", items: [
    "When you chat with the AI Chef, your message (and the last few messages of the conversation) is sent to our server and on to an AI provider (Google Gemini) to produce a reply. Don't put personal, medical or sensitive information in AI messages.",
    "If the AI service isn't available, CRUNCH answers with a built-in engine that runs entirely on your device." ] },
  { title: "Safety and moderation", items: [
    "Recipes, posts and reports are scanned and reviewed to enforce the Terms of Service. Reports you file and the strikes, bans and refund decisions that result are kept as safety records.",
    "Reports are reviewed by people. We may keep records of banned accounts to stop people coming back." ] },
  { title: "Age", items: [ "You must be 13 or older to use CRUNCH, and 18 or older to buy or sell recipes. Your birth year is used only for these age protections." ] },
  { title: "Your choices", items: [
    "You can export a copy of your data, or erase everything stored on your device, from Settings → Account.",
    "Because data lives in your browser, clearing your browser's site data also removes it.",
    "When accounts move to our servers we'll update this page, tell you in the app, and let you request a copy or deletion of your data." ] },
  { title: "Children", items: [ "CRUNCH isn't for children under 13 and we don't knowingly collect their information." ] },
  { title: "Changes", items: [ "If we change how we handle data we'll update this page. Continuing to use CRUNCH after a change means you accept it." ] },
];
export default function Privacy() {
  const nav = useNavigate();
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <button className="btn-ghost mb-4" onClick={() => (history.length > 1 ? nav(-1) : nav("/"))}>← Back</button>
      <h1 className="h-display text-4xl">Privacy Policy</h1>
      <p className="mt-1 text-sm text-brown">Plain-English summary of how CRUNCH handles your information. See also the <Link to="/terms" className="underline">Terms of Service</Link>.</p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="card mt-5 p-5"><h2 className="h-display text-2xl">{s.title}</h2><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{s.items.map((i) => <li key={i}>{i}</li>)}</ul></section>))}
    </main>
  );
}
