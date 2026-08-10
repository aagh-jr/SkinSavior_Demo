// Per-user rate limiting for the paid AI endpoints (currently product ingest).
//
// Two sliding windows are enforced per identifier: a short burst window and a
// daily cap. The identifier is the signed-in user's id, so limits are per
// account rather than per IP.
//
// Rate limiting is ACTIVE only when the Upstash env vars are present. Without
// them we FAIL OPEN (allow the request) and warn once — so local dev and any
// build that predates Upstash provisioning still work. The Anthropic Console
// spend cap remains the ultimate money backstop regardless of this layer.
//
// Setup: create a free Upstash Redis database (https://upstash.com) and set
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// in .env.local and in Vercel (Production + Preview).

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Tunable limits. Keep these in one place so raising them later is a one-liner.
export const INGEST_PER_MINUTE = 3;
export const INGEST_PER_DAY = 40;

type Limiters = { perMinute: Ratelimit; perDay: Ratelimit };

// undefined = not yet resolved; null = Upstash not configured (fail open).
let _limiters: Limiters | null | undefined;
let _warned = false;

function getLimiters(): Limiters | null {
  if (_limiters !== undefined) return _limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!_warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED (fail-open). Set them to enforce per-user limits.",
      );
      _warned = true;
    }
    _limiters = null;
    return null;
  }

  const redis = new Redis({ url, token });
  _limiters = {
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(INGEST_PER_MINUTE, "60 s"),
      prefix: "rl:ingest:min",
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(INGEST_PER_DAY, "24 h"),
      prefix: "rl:ingest:day",
    }),
  };
  return _limiters;
}

export interface RateLimitResult {
  ok: boolean;
  scope?: "minute" | "day";
  limit?: number;
  remaining?: number;
  /** Epoch ms when the tripped window resets. */
  resetAt?: number;
}

/**
 * Enforce the ingest limits for `identifier` (a user id). Checks the minute
 * window first so a burst is rejected before spending the daily budget on the
 * lookup. Returns `{ ok: true }` when Upstash isn't configured.
 */
export async function checkIngestRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limiters = getLimiters();
  if (!limiters) return { ok: true };

  const minute = await limiters.perMinute.limit(identifier);
  if (!minute.success) {
    return {
      ok: false,
      scope: "minute",
      limit: minute.limit,
      remaining: minute.remaining,
      resetAt: minute.reset,
    };
  }

  const day = await limiters.perDay.limit(identifier);
  if (!day.success) {
    return {
      ok: false,
      scope: "day",
      limit: day.limit,
      remaining: day.remaining,
      resetAt: day.reset,
    };
  }

  return { ok: true, remaining: Math.min(minute.remaining, day.remaining) };
}
