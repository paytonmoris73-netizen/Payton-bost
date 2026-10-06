import type { GeoPoint } from "./types";

/** Best-effort current position. Resolves undefined if unavailable or denied; never throws. */
export function getPosition(timeoutMs = 8000): Promise<GeoPoint | undefined> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(undefined);
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

export function mapLink(p: { lat: number; lng: number }): string {
  return `https://www.google.com/maps?q=${p.lat},${p.lng}`;
}
