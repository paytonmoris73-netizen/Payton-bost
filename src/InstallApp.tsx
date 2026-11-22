import { useState } from "react";
import { platform, useInstall } from "./pwa";
import { toast } from "./ui";

const ShareGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-[-3px]" aria-hidden><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
);

function Steps() {
  const p = platform();
  if (p === "ios") return <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brown"><li>Tap <b className="text-charcoal">Share</b> <ShareGlyph /> in Safari's toolbar.</li><li>Choose <b className="text-charcoal">Add to Home Screen</b>, then <b className="text-charcoal">Add</b>.</li><li>Open CRUNCH from your Home Screen. It runs full-screen, like any app.</li></ol>;
  if (p === "mac-safari") return <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brown"><li>In Safari's menu bar choose <b className="text-charcoal">File → Add to Dock</b>.</li><li>Open CRUNCH from your Dock or Launchpad.</li></ol>;
  return <p className="mt-2 text-sm text-brown">Open CRUNCH in <b className="text-charcoal">Chrome</b>, <b className="text-charcoal">Edge</b> or <b className="text-charcoal">Safari</b>, then use the install icon in the address bar (or the browser menu → <b className="text-charcoal">Install CRUNCH</b>).</p>;
}

/** Settings card: install button, platform steps, or "installed". */
const PREVIEW = !!import.meta.env.VITE_HASH_ROUTER; // shared preview link: installing must happen from the real site

export function InstallCard() {
  const { evt, installed, install } = useInstall();
  if (PREVIEW) return <div className="tile p-4 text-sm text-brown">To install CRUNCH as an app, open your CRUNCH website (your Vercel link) on this device.</div>;
  return (
    <div className="tile flex items-start gap-4 p-4">
      <img src="/icons/icon-192.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-[1rem] shadow-[0_8px_18px_-8px_rgba(0,0,0,.5)]" />
      <div className="min-w-0 flex-1">
        <b className="block">{installed ? "You're using the CRUNCH app" : "Get the CRUNCH app"}</b>
        {installed ? <p className="text-sm text-brown">It opens full-screen, works offline and updates itself.</p> : <>
          <p className="text-sm text-brown">Install it on this device: its own icon, full-screen, faster launches, works offline. No app store needed.</p>
          {evt ? <button className="btn-primary mt-3" onClick={async () => { if (await install()) toast("CRUNCH installed"); }}>Install CRUNCH</button> : <Steps />}
        </>}
      </div>
    </div>
  );
}

const KEY = "crunch-install-banner";
/** Small dismissible banner (Home) on devices that can install and haven't. */
export function InstallBanner() {
  const { evt, installed, install } = useInstall();
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(KEY) === "hide"; } catch { return false; } });
  const [how, setHow] = useState(false);
  const p = platform();
  if (PREVIEW || installed || hidden || (!evt && p !== "ios" && p !== "mac-safari")) return null;
  const dismiss = () => { setHidden(true); try { localStorage.setItem(KEY, "hide"); } catch { /* ignore */ } };
  return (
    <div className="card rise-in mb-6 flex items-start gap-3 p-3.5 sm:items-center" role="region" aria-label="Install CRUNCH">
      <img src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-[0.8rem]" />
      <div className="min-w-0 flex-1">
        <b className="block text-sm">Get the CRUNCH app</b>
        <span className="text-xs text-brown">Full-screen, faster and works offline.</span>
        {how && <Steps />}
      </div>
      {evt ? <button className="btn-primary !px-4 !py-2" onClick={() => install()}>Install</button> : !how && <button className="btn-ghost !px-4 !py-2" onClick={() => setHow(true)}>How</button>}
      <button onClick={dismiss} className="press grid h-8 w-8 shrink-0 place-items-center rounded-full bg-charcoal/[0.07] text-charcoal/60" aria-label="Dismiss">✕</button>
    </div>
  );
}
