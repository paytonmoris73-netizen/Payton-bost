import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMe } from "../store";
import { TERMS, TERMS_VERSION } from "../terms";

/** The terms themselves: used by the Terms page and by the sign-up sheet.
 *  Contents links only scroll (they never touch the address, which would break hash routing). */
export function TermsBody() {
  return (
    <>
      <div role="note" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><b>The short version:</b> cook at your own risk and check allergens yourself. Food poisoning and unsafe recipes are not okay. Scamming is an instant permanent ban. False reports get you banned on the second offence. Refunds exist, but only in the specific cases in section 7.</div>
      <nav aria-label="Contents" className="card mt-5 p-4"><ol className="grid gap-1 text-sm sm:grid-cols-2">{TERMS.map((s) => <li key={s.id}><a className="underline" href={"#" + s.id} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{s.title}</a></li>)}</ol></nav>
      {TERMS.map((s) => (
        <section key={s.id} id={s.id} className="card mt-5 scroll-mt-4 p-5">
          <h2 className="h-display text-2xl">{s.title}</h2>
          {s.intro && <p className="mt-2 text-sm text-brown">{s.intro}</p>}
          {s.items && <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>}
          {s.groups?.map((g) => (<div key={g.title} className="mt-4"><h3 className="text-sm font-bold">{g.title}</h3><ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-sm">{g.items.map((i) => <li key={i}>{i}</li>)}</ul></div>))}
        </section>))}
    </>
  );
}

/** Public page: reachable before sign-up and from inside the app. */
export default function Terms() {
  const me = useMe(); const { hash } = useLocation(); const nav = useNavigate();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0); }, [hash]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <button className="btn-ghost mb-4" onClick={() => (history.length > 1 ? nav(-1) : nav("/"))}>← Back</button>
      <h1 className="h-display text-4xl">Terms of Service</h1>
      <p className="mt-1 text-sm text-brown">Version {TERMS_VERSION} · Please read this. It explains what's allowed, what isn't, who's responsible for your food, and when you can get a refund.</p>
      <TermsBody />
      {me && <p className="mt-6 text-center text-xs text-brown">See also the <Link to="/safety" className="underline">Safety Center</Link>.</p>}
    </main>
  );
}
