/* Photos and short videos for Bites. Files are stored in IndexedDB (far more room than localStorage), per device.
   In production this becomes object storage with signed URLs and server-side moderation (see docs/BACKEND.md). */
import { useEffect, useState } from "react";

const DB = "crunch-media", STORE = "media";
let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbp) dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return dbp;
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode); const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req ? (req as IDBRequest<T>).result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
}
export const putMedia = (id: string, blob: Blob) => tx("readwrite", (s) => { s.put(blob, id); }).then(() => undefined);
export const deleteMedia = (id: string) => tx("readwrite", (s) => { s.delete(id); }).then(() => undefined).catch(() => undefined);
export const clearAllMedia = () => new Promise<void>((res) => { try { dbp = null; const r = indexedDB.deleteDatabase(DB); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } });

const urls = new Map<string, string>();
/** Object URL for a stored file (cached for the session). undefined while loading or if missing. */
export function useMediaUrl(id?: string): string | undefined {
  const [url, setUrl] = useState(() => (id ? urls.get(id) : undefined));
  useEffect(() => {
    if (!id) return setUrl(undefined);
    if (urls.has(id)) return setUrl(urls.get(id));
    let live = true;
    tx<Blob>("readonly", (s) => s.get(id)).then((b) => { if (!b || !live) return; const u = URL.createObjectURL(b); urls.set(id, u); setUrl(u); }).catch(() => undefined);
    return () => { live = false; };
  }, [id]);
  return url;
}

export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_MB = 60;

/** Downscale a photo to a JPEG blob (keeps storage small; strips location metadata as a side effect). */
export function imageToBlob(file: File, max = 1600, quality = 0.84): Promise<Blob> {
  return new Promise((res, rej) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return rej(new Error("Please choose a JPG, PNG or WebP photo."));
    if (file.size > 15 * 1024 * 1024) return rej(new Error("That photo is over 15 MB."));
    const u = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't process that photo."))), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Couldn't read that photo.")); };
    img.src = u;
  });
}

/** Checks a short video: type, size and length (60 s max, like Shorts). */
export function checkVideo(file: File): Promise<{ seconds: number }> {
  return new Promise((res, rej) => {
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) return rej(new Error("Please choose an MP4, WebM or MOV video."));
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return rej(new Error(`That video is over ${MAX_VIDEO_MB} MB.`));
    const u = URL.createObjectURL(file); const v = document.createElement("video"); v.preload = "metadata"; v.muted = true;
    const done = (fn: () => void) => { URL.revokeObjectURL(u); fn(); };
    v.onloadedmetadata = () => done(() => (v.duration > MAX_VIDEO_SECONDS + 0.5 ? rej(new Error(`Bites can be up to ${MAX_VIDEO_SECONDS} seconds. This one is ${Math.round(v.duration)} s.`)) : res({ seconds: v.duration })));
    v.onerror = () => done(() => rej(new Error("Couldn't read that video. Try MP4.")));
    v.src = u;
  });
}
