import { afterEach, expect, it, vi } from "vitest";
import { checkIngestRateLimit } from "./rate-limit";

afterEach(() => vi.unstubAllEnvs());

it("does not permit paid calls without a configured limiter", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  expect(await checkIngestRateLimit("test-account")).toEqual({ ok: false, unavailable: true });
});
