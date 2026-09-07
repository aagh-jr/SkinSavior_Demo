// San Jose, CA — hardcoded until the app has real location data (see
// CLAUDE.md "Open" list: no location service yet).
const SAN_JOSE = { lat: 37.3382, lon: -121.8863 };

const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${SAN_JOSE.lat}&longitude=${SAN_JOSE.lon}` +
  `&current=uv_index&daily=uv_index_max&timezone=America%2FLos_Angeles&forecast_days=1`;

export interface UvReading {
  uv: number;
  dayMax: number;
  location: string;
  label: string;
  reapply: string;
}

// EPA UV index bands (https://www.epa.gov/sunsafety/uv-index-scale-0).
function bandFor(uv: number): { label: string; reapply: string } {
  if (uv < 3) return { label: "Low", reapply: "Reapply every 3h" };
  if (uv < 6) return { label: "Moderate", reapply: "Reapply every 2-3h" };
  if (uv < 8) return { label: "High", reapply: "Reapply every 2h" };
  if (uv < 11) return { label: "Very high", reapply: "Reapply every 2h" };
  return { label: "Extreme", reapply: "Reapply every hour" };
}

/**
 * Current UV index for San Jose — no API key needed (Open-Meteo). Used by
 * both the home page (direct server-side call) and /api/uv-index (for any
 * client-side caller). Returns null on any failure; callers decide the
 * fallback UI.
 */
export async function getUvIndex(): Promise<UvReading | null> {
  try {
    const res = await fetch(FORECAST_URL, {
      // UV moves slowly through the day — no need to hit Open-Meteo on
      // every request.
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data: {
      current?: { uv_index?: number };
      daily?: { uv_index_max?: number[] };
    } = await res.json();

    const dayMax = data.daily?.uv_index_max?.[0];
    const uv = data.current?.uv_index ?? dayMax;
    if (uv == null) return null;

    const rounded = Math.round(uv);
    return {
      uv: rounded,
      dayMax: dayMax != null ? Math.round(dayMax) : rounded,
      location: "San Jose, CA",
      ...bandFor(rounded),
    };
  } catch {
    return null;
  }
}
