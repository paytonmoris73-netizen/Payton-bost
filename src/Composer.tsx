import { useEffect, useRef, useState } from "react";
import { G } from "./icons";
import { matchScore } from "./engine";
import { useCatalogue, useIngredients, useMe, useStore } from "./store";
import { Modal, toast } from "./ui";
import { Select } from "./glass";
import { checkVideo, deleteMedia, imageToBlob, MAX_VIDEO_SECONDS, putMedia } from "./media";

type Picked = { kind: "image" | "video"; blob: Blob; url: string } | null;

/** Post to the community. With a photo or short video it becomes a Bite (Community → Bites). */
export function Composer({ onClose, challengeId, bite }: { onClose: () => void; challengeId?: string; bite?: boolean }) {
  const me = useMe()!; const addPost = useStore((s) => s.addPost); const ings = useIngredients(); const cat = useCatalogue(); const join = useStore((s) => s.joinChallenge);
  const [text, setText] = useState(""); const [picked, setPicked] = useState<string[]>([]); const [q, setQ] = useState(""); const [recipe, setRecipe] = useState(""); const [emoji, setEmoji] = useState("🍽️");
  const [media, setMedia] = useState<Picked>(null); const [rulesOk, setRulesOk] = useState(false); const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (media) URL.revokeObjectURL(media.url); }, [media]);
  const sugg = q.trim() ? ings.filter((i) => !picked.includes(i.name) && matchScore(q, i.name) > 0).slice(0, 5) : [];
  const mine = cat.filter((r) => r.creatorId === me.id && r.status === "published");

  const choose = async (f?: File) => {
    if (!f) return;
    try {
      if (f.type.startsWith("video/")) { await checkVideo(f); setMedia({ kind: "video", blob: f, url: URL.createObjectURL(f) }); }
      else { const b = await imageToBlob(f); setMedia({ kind: "image", blob: b, url: URL.createObjectURL(b) }); }
    } catch (e) { toast((e as Error).message, "err"); }
  };
  const submit = async () => {
    if (text.trim().length < 5) return toast("Write a few words about your creation.", "err");
    if (bite && !media) return toast("Add a photo or a short video for your Bite.", "err");
    setBusy(true);
    let mediaRef: { kind: "image" | "video"; id: string } | undefined;
    if (media) {
      mediaRef = { kind: media.kind, id: "m_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) };
      try { await putMedia(mediaRef.id, media.blob); } catch { setBusy(false); return toast("Couldn't save that file on this device. Try a smaller one.", "err"); }
    }
    const out = addPost({ text: text.trim().slice(0, 600), emoji, hue: (emoji.codePointAt(0) ?? 30) % 360, ingredients: picked, recipeId: recipe || undefined, challengeId, media: mediaRef });
    setBusy(false);
    if (out.result === "blocked") { if (mediaRef) deleteMedia(mediaRef.id); return toast(out.message, "err"); }
    if (challengeId) join(challengeId); onClose(); toast(out.message);
  };

  return (
    <Modal open onClose={onClose} title={challengeId ? "Submit challenge entry" : bite ? "Post a Bite" : "Share with the community"}>
      {/* media first: it's the heart of a Bite */}
      <div className="mb-3">
        {media ? (
          <div className="relative mx-auto w-40 overflow-hidden rounded-[1.25rem] bg-black shadow-[var(--lift)]" style={{ aspectRatio: "9 / 16" }}>
            {media.kind === "video" ? <video src={media.url} className="h-full w-full object-cover" muted autoPlay loop playsInline /> : <img src={media.url} alt="Your photo" className="h-full w-full object-cover" />}
            <button type="button" onClick={() => { setMedia(null); setRulesOk(false); }} className="press absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full glass-dark text-sm" aria-label="Remove media"><G g="✕" size={14} /></button>
          </div>
        ) : (
          <>
            <label className="mb-2 flex items-start gap-2 rounded-xl bg-orange-light/40 p-2.5 text-xs text-charcoal"><input type="checkbox" checked={rulesOk} onChange={(e) => setRulesOk(e.target.checked)} className="mt-0.5" /><span>My photo or video shows <b>food or cooking only</b>, it's mine or I have permission, and it has <b>no nudity, sexual, violent, gory or hateful content</b> and no people without their permission. Breaking this means a <b>permanent ban</b>.</span></label>
            <button type="button" className={`tile press flex w-full items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed border-orange/40 px-4 py-5 text-sm font-semibold ${rulesOk ? "" : "cursor-not-allowed opacity-50"}`}
              onClick={() => (rulesOk ? fileRef.current?.click() : toast("Tick the photo and video rules box first.", "err"))}>
              <span className="grid h-11 w-11 place-items-center rounded-full accent-fill"><G g="🎬" size={20} /></span>
              <span className="text-left">Add a photo or video<span className="block text-xs font-normal text-brown">Vertical works best · videos up to {MAX_VIDEO_SECONDS} s</span></span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="sr-only" disabled={!rulesOk} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; choose(f); }} />
          </>
        )}
      </div>
      <textarea className="input mb-3" rows={3} placeholder={bite ? "What's in this Bite?" : "What did you make or discover?"} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} aria-label="Post text" />
      {!media && <div className="mb-3"><span className="label">No photo? Pick an icon</span><div className="flex flex-wrap gap-1.5">{["🍽️", "🍝", "🥗", "🍰", "🍜", "🍳", "🥘", "🍹"].map((e) => <button key={e} type="button" onClick={() => setEmoji(e)} aria-pressed={emoji === e} className={`press grid h-10 w-10 place-items-center rounded-[0.9rem] text-lg transition-[background,box-shadow] duration-300 ${emoji === e ? "sel-fill" : "tile"}`}>{e}</button>)}</div></div>}
      <div className="mb-3"><div className="mb-1 flex flex-wrap gap-1.5">{picked.map((p) => <button key={p} type="button" className="chip bg-orange-light" onClick={() => setPicked(picked.filter((x) => x !== p))}>{p} <G g="✕" /></button>)}</div><input className="input" placeholder="Tag ingredients (people can grab them for their list)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tag ingredients" /><div className="mt-1 flex flex-wrap gap-1.5">{sugg.map((i) => <button key={i.id} type="button" className="chip" onClick={() => { setPicked([...picked, i.name]); setQ(""); }}><G g="＋" /> {i.emoji} {i.name}</button>)}</div></div>
      {mine.length > 0 && <div className="mb-3"><Select label="Link a recipe" value={recipe} onChange={setRecipe} options={[{ value: "", label: "Link one of your recipes (optional)" }, ...mine.map((r) => ({ value: r.id, label: r.title }))]} /></div>}
      <button className="btn-primary w-full" onClick={submit} disabled={busy}>{busy ? "Posting…" : bite ? "Post Bite" : "Post"}</button>
    </Modal>
  );
}
