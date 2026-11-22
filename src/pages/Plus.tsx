import { Link } from "react-router-dom";
import { G } from "../icons";
import { useMe } from "../store";
import { PageHeader } from "../ui";

const ROWS: [string, string, string][] = [
  ["Food Combiner & analysis", "Unlimited", "Unlimited"], ["AI chat & recipe generation", "Fair-use daily allowance", "Higher limits"], ["Advanced recipe customisation", "—", "✓"],
  ["Personal collections & folders", "Up to 5 folders", "Unlimited"], ["Cookbook organisation tools", "Basic", "Enhanced"], ["Creator analytics", "Basic stats", "Advanced"], ["Buying & selling recipes", "✓", "✓"],
];

export default function Plus() {
  const me = useMe()!;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="CRUNCH Plus" sub="For people who cook and create a lot. The free plan stays genuinely useful." />
      <div className="card overflow-hidden"><table className="w-full text-sm"><thead className="bg-cream text-left"><tr><th className="p-4">Feature</th><th className="p-4">Free</th><th className="p-4">Plus</th></tr></thead><tbody>{ROWS.map(([a, b, c]) => <tr key={a} className="border-t border-cream"><td className="p-4 font-medium">{a}</td><td className="p-4 text-brown">{b === "✓" ? <G g="✓" /> : b}</td><td className="p-4 font-semibold">{c === "✓" ? <G g="✓" className="text-orange" /> : c}</td></tr>)}</tbody></table></div>
      <div className="card mt-5 p-6"><div className="flex items-baseline gap-2"><span className="text-4xl font-bold">$6.99</span><span className="text-brown">per month</span></div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-brown"><li>Planned price. Billed monthly and renews automatically until cancelled.</li><li>You'd be told the price and renewal date before paying, and could cancel any time from Settings.</li><li>No charge happens without your explicit confirmation.</li></ul>
        <button className="btn-primary mt-4" disabled>Subscription <span className="ml-1 rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-bold uppercase">Coming soon</span></button>
        <p className="mt-2 text-xs text-brown">Plus can't be purchased yet because no payment provider is connected. {me.plus ? "" : <>Current plan: Free. <Link to="/settings" className="underline">Integration setup</Link></>}</p></div>
    </div>
  );
}
