import { Link } from "react-router-dom";
import { useMe, useStore } from "../store";
import { PageHeader } from "../ui";
import { EXAMPLE_REMOVALS } from "../safetyStore";
import { LADDER, REPORT_CATEGORIES, REPORT_HOURLY_LIMIT, RULES, SCAM_WARNING, SUSPENSION_DAYS, activeStrikes } from "../safety";

export default function Safety() {
  const me = useMe()!; const { removals, strikes, suspensions, appeals } = useStore();
  const wall = [...removals, ...EXAMPLE_REMOVALS.slice(removals.length >= 4 ? 4 : 0, 4)].slice(0, 12);
  const mine = activeStrikes(strikes, me.id); const abuse = activeStrikes(strikes, me.id, "false-report"); const until = suspensions[me.id]; const suspended = until && new Date(until).getTime() > Date.now();
  const myAppeals = appeals.filter((a) => a.accountId === me.id);
  return (
    <div>
      <PageHeader title="Safety Center" sub="How CRUNCH keeps recipes safe and scammers out." />

      <div role="note" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
        <h2 className="h-display text-xl">⚠️ Thinking about scamming? Don't.</h2>
        <p className="mt-1 text-sm">{SCAM_WARNING}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5"><h2 className="h-display text-xl">The CRUNCH Safety Promise</h2>
          <ul className="mt-3 space-y-3">{RULES.map((r) => <li key={r.title} className="flex gap-3 text-sm"><span className="text-2xl" aria-hidden>{r.icon}</span><span><b>{r.title}</b><span className="block text-brown">{r.text}</span></span></li>)}</ul></section>

        <section className="card p-5"><h2 className="h-display text-xl">What happens if you break them</h2>
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><b>🚫 Scamming: 1 strike = permanent ban.</b><span className="block">If a moderator confirms a scam (fake or bait-and-switch recipe, off-platform payment, fake reviews), the account is banned forever. No warning. Buyers are refunded automatically.</span></div>
          <div className="mt-2 rounded-xl border border-orange-light bg-orange-light/40 p-3 text-sm"><b>⚠️ False reports: banned on the 2nd offence.</b><span className="block">Reporting something you know is fine: 1st time, a warning and reporting is paused for {SUSPENSION_DAYS} days. 2nd time, permanent ban.</span></div>
          <h3 className="mt-4 text-sm font-semibold">Other rule-breaking (unsafe content, stolen recipes, harassment)</h3>
          <ol className="mt-2 space-y-2">{LADDER.map((l) => <li key={l.strike} className="rounded-xl bg-cream p-3 text-sm"><b>{l.strike}</b> · {l.text}</li>)}</ol>
          <p className="mt-3 text-xs text-brown">Dangerous food content is refused automatically. Repeated attempts earn a strike. Content removed by mistake can be appealed from your Studio. <Link to="/terms" className="underline">Full Terms of Service</Link></p>
          <div className="mt-4 rounded-xl bg-sage-light/60 p-3 text-sm"><b>Your standing:</b> {suspended ? `Suspended until ${new Date(until!).toLocaleDateString()}` : mine.length || abuse.length ? `${mine.length} active strike${mine.length === 1 ? "" : "s"}${abuse.length ? `, ${abuse.length} false-report warning${abuse.length > 1 ? "s" : ""}` : ""}` : "Good standing ✅"}
            {mine.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{mine.map((k) => <li key={k.id}>{k.reason} · {new Date(k.at).toLocaleDateString()}</li>)}</ul>}
            {myAppeals.length > 0 && <p className="mt-2 text-xs">Appeals: {myAppeals.map((a) => a.status).join(", ")}</p>}</div></section>
      </div>

      <section className="card mt-5 p-5"><h2 className="h-display text-xl">🧱 Wall of Removed Scams</h2>
        <p className="mt-1 text-sm text-brown">Real removals appear here, anonymously. No names, just what was caught and what happened.</p>
        <ul className="mt-3 divide-y divide-cream">{wall.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
            <span className="chip bg-red-100">{w.category === "scan" ? "Caught by scan" : REPORT_CATEGORIES.find((c) => c.id === w.category)?.label ?? "Violation"}</span>
            <b className="min-w-0 flex-1">{w.what}</b><span className="text-xs text-brown">{w.outcome}{w.example ? " · example" : w.at ? " · " + new Date(w.at).toLocaleDateString() : ""}</span>
          </li>))}</ul>
        {removals.length < 4 && <p className="mt-2 text-xs text-brown">Entries marked “example” show the kind of thing that gets removed. They'll be replaced by real removals as they happen.</p>}
      </section>

      <section className="card mt-5 p-5"><h2 className="h-display text-xl">How reporting works (and why false reports don't work)</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-brown">
          <li>Use <b>Report</b> on any recipe, listing, post or creator and pick what's wrong. A person reviews every report.</li>
          <li>When several different, credible people report the same thing, it's <b>hidden</b> until a moderator decides. It's never deleted automatically.</li>
          <li>One person reporting the same thing again and again counts once. Brand-new accounts count for much less, and a burst of new accounts reporting the same target is flagged as a pile-on and doesn't hide anything.</li>
          <li>If moderators reject your reports, your reports count for less. If most are rejected, reporting is paused for a week. If they're upheld, your reports count for more.</li>
          <li><b>Deliberately false reports are a banning offence:</b> a warning the first time, a permanent ban the second.</li>
          <li>You can report at most {REPORT_HOURLY_LIMIT} things an hour, and you can't report your own content.</li>
          <li>Removed something that was fine? Open <b>Studio</b> and use <b>Appeal</b>. If you win, the strike is removed.</li>
        </ul></section>
    </div>
  );
}
