import { STORE_ITEMS, PREMIUM_PERKS } from "../data/store";
import { useApp } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui";

export function StorePage() {
  const { state, setPremium, purchase, pushToast } = useApp();

  const buy = (id: string, name: string) => {
    if (id === "premium-pass") {
      setPremium(true);
      pushToast("Welcome to Premium! 👑", "All Pro workouts are now unlocked");
      return;
    }
    purchase(id);
    pushToast("Purchase complete", `${name} added to your account`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Store</h1>
        <p className="mt-1 text-sm text-cream-dim">Unlock more with Apex Premium.</p>
      </header>

      {/* Premium hero */}
      <div className="card relative mt-6 overflow-hidden border-gold-500/40 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/15 via-transparent to-transparent" />
        <Icon
          name="crown"
          filled={false}
          className="absolute -right-8 -top-8 h-44 w-44 text-gold-500/10"
        />
        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl gold-fill text-ink-950 shadow-glow">
            <Icon name="crown" className="h-7 w-7" filled={false} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Apex <span className="gold-text">Premium</span>
          </h2>
          <p className="mt-1 text-sm text-cream-dim">Get more. Do more.</p>
          <ul className="mt-5 space-y-2.5">
            {PREMIUM_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-gold-400">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
          {state.premium ? (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-xl border border-gold-500/50 bg-gold-500/10 px-5 py-3 text-sm font-bold text-gold-300">
                <Icon name="check" className="h-4 w-4" />
                You're a Premium member
              </span>
              <button
                onClick={() => {
                  setPremium(false);
                  pushToast("Premium cancelled", "You can rejoin anytime");
                }}
                className="text-xs font-semibold text-cream-faint hover:text-cream-dim"
              >
                Cancel membership
              </button>
            </div>
          ) : (
            <Button size="lg" className="mt-6" onClick={() => buy("premium-pass", "Premium Pass")}>
              <Icon name="crown" className="h-5 w-5" filled={false} />
              Go Premium — $9.99/mo
            </Button>
          )}
        </div>
      </div>

      {/* Boosters */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-bold">Boost Your Journey</h2>
        <div className="space-y-3">
          {STORE_ITEMS.filter((i) => i.id !== "premium-pass").map((item) => {
            const owned = state.ownedItems.includes(item.id);
            return (
              <div key={item.id} className="card card-hover flex items-center gap-4 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="truncate text-xs text-cream-dim">{item.description}</div>
                </div>
                {owned ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-gold-400">
                    <Icon name="check" className="h-4 w-4" />
                    Owned
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => buy(item.id, item.name)}>
                    {item.price}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] text-cream-faint">
          Demo store — purchases are simulated and never charge anything.
        </p>
      </section>
    </div>
  );
}
