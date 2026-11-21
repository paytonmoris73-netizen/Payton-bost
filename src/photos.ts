/* Real photo lookup. Files in src/photos/ named by recipe or ingredient id override the placeholder cover. */
const files = import.meta.glob("/src/photos/*.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export const PHOTOS: Record<string, string> = Object.fromEntries(Object.entries(files).map(([p, url]) => [p.split("/").pop()!.replace(/\.[^.]+$/, ""), url]));
const credits = import.meta.glob("/src/photos/credits.json", { eager: true, import: "default" }) as Record<string, Record<string, { by: string; license: string; url?: string }>>;
const CREDITS = Object.values(credits)[0] ?? {};
export const photoFor = (id?: string, own?: string) => own || (id ? PHOTOS[id] : undefined);
export const creditFor = (id: string) => { const k = Object.keys(CREDITS).find((f) => f.replace(/\.[^.]+$/, "") === id); return k ? CREDITS[k] : undefined; };

/** Downscale a user-chosen image file to a compact JPEG data URL (for uploads). */
export function fileToJpeg(file: File, max = 1400, quality = 0.82): Promise<string> {
  return new Promise((res, rej) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return rej(new Error("Please choose a JPG, PNG or WebP image."));
    if (file.size > 12 * 1024 * 1024) return rej(new Error("That image is over 12 MB."));
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", quality)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Couldn't read that image.")); };
    img.src = url;
  });
}
