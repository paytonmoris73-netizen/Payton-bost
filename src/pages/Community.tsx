import { useState } from "react";
import { POSTS, CHALLENGES, FRIENDS } from "../data/community";
import { useApp } from "../state/AppContext";
import { Icon } from "../components/Icon";
import { Avatar, Button } from "../components/ui";

type Tab = "feed" | "challenges" | "friends";

export function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const { state, toggleLike, toggleChallenge, pushToast } = useApp();

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Community</h1>
        <p className="mt-1 text-sm text-cream-dim">Connect, share, and compete.</p>
      </header>

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        {(
          [
            ["feed", "Feed"],
            ["challenges", "Challenges"],
            ["friends", "Friends"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`chip ${tab === id ? "chip-active" : "hover:text-cream"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {tab === "feed" && (
        <div className="mt-5 space-y-3">
          {POSTS.map((p) => {
            const liked = state.likedPosts.includes(p.id);
            return (
              <article key={p.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={p.author} hue={p.avatarHue} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.author}</div>
                    <div className="text-xs text-cream-faint">
                      {p.handle} · {p.timeAgo} ago
                    </div>
                  </div>
                  {p.workout && (
                    <span className="chip shrink-0 border-gold-500/40 text-gold-300">
                      <Icon name="dumbbell" className="h-3.5 w-3.5" />
                      {p.workout}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed">{p.text}</p>
                <div className="mt-4 flex items-center gap-5 border-t border-line pt-3 text-xs font-bold">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      liked ? "text-red-400" : "text-cream-faint hover:text-cream-dim"
                    }`}
                    aria-pressed={liked}
                  >
                    <Icon name="heart" className="h-4 w-4" filled={liked} />
                    {p.likes + (liked ? 1 : 0)}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-cream-faint">
                    <Icon name="comment" className="h-4 w-4" />
                    {p.comments}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Challenges */}
      {tab === "challenges" && (
        <div className="mt-5 space-y-3">
          {CHALLENGES.map((c) => {
            const joined = state.joinedChallenges.includes(c.id);
            return (
              <div key={c.id} className={`card p-5 ${joined ? "border-gold-500/40" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display font-bold">{c.name}</div>
                    <p className="mt-1 text-sm text-cream-dim">{c.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-cream-faint">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="calendar" className="h-3.5 w-3.5" />
                        {c.days} days
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="users" className="h-3.5 w-3.5" />
                        {c.participants.toLocaleString()} joined
                      </span>
                      <span className="inline-flex items-center gap-1 text-gold-400">
                        <Icon name="bolt" className="h-3.5 w-3.5" />
                        +{c.rewardXp} XP
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={joined ? "outline" : "gold"}
                    onClick={() => {
                      toggleChallenge(c.id);
                      pushToast(
                        joined ? "Left challenge" : "Challenge joined!",
                        joined ? c.name : `${c.name} — good luck!`,
                      );
                    }}
                  >
                    {joined ? (
                      <>
                        <Icon name="check" className="h-3.5 w-3.5" />
                        Joined
                      </>
                    ) : (
                      "Join"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Friends leaderboard */}
      {tab === "friends" && (
        <div className="card mt-5 divide-y divide-line">
          <div className="flex items-center justify-between px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wide text-cream-faint">
            <span>This week's leaderboard</span>
            <span>XP</span>
          </div>
          {FRIENDS.map((f, i) => (
            <div key={f.name} className="flex items-center gap-4 px-5 py-3.5">
              <span
                className={`w-6 text-center font-display text-sm font-bold ${
                  i === 0 ? "gold-text" : "text-cream-faint"
                }`}
              >
                {i + 1}
              </span>
              <Avatar name={f.name} hue={f.avatarHue} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{f.name}</div>
                <div className="text-xs text-cream-faint">{f.streak}-day streak</div>
              </div>
              <span className="font-display text-sm font-bold text-gold-300">
                {f.xpThisWeek.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
