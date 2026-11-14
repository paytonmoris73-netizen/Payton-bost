import { useAppStore } from "../../stores/appStore";
import { Icon } from "../Icon";

export function MiniPlayer() {
  const playing = useAppStore((s) => s.audioPlaying);
  const currentId = useAppStore((s) => s.audioCurrentId);
  const setPlaying = useAppStore((s) => s.setAudioPlaying);
  const rate = useAppStore((s) => s.audioPlaybackRate);
  const setRate = useAppStore((s) => s.setAudioRate);

  if (!currentId) return null;

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="fixed bottom-16 inset-x-0 z-40 lg:bottom-0 lg:left-60 px-4 pb-2">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface-1/95 shadow-elevated backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
          <Icon name="headphones" className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text-primary">Now Playing</div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-surface-3">
              <div className="h-full w-1/3 rounded-full bg-accent transition-all" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPlaying(!playing)} className="rounded-full p-2 hover:bg-surface-2 transition-colors text-text-primary">
            <Icon name={playing ? "pause" : "play"} className="h-5 w-5" filled />
          </button>
          <button
            onClick={() => {
              const idx = rates.indexOf(rate);
              setRate(rates[(idx + 1) % rates.length]);
            }}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-colors"
          >
            {rate}x
          </button>
          <button onClick={() => useAppStore.getState().setAudioCurrent(null)} className="rounded-full p-2 hover:bg-surface-2 transition-colors text-text-tertiary">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
