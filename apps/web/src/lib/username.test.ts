import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ supabase: {} }));

import { normalizeUsername, validateUsername } from "./username";

describe("normalizeUsername", () => {
  it("trims, drops a leading @ and lowercases", () => {
    expect(normalizeUsername("  @Abel_G ")).toBe("abel_g");
  });
});

describe("validateUsername", () => {
  it("accepts lowercase letters, numbers and underscores", () => {
    expect(validateUsername("skin_fan99")).toBeNull();
  });

  it("rejects empty, short and long names", () => {
    expect(validateUsername("")).toMatch(/choose/i);
    expect(validateUsername("ab")).toMatch(/at least 3/);
    expect(validateUsername("a".repeat(21))).toMatch(/at most 20/);
  });

  it("rejects characters that aren't URL-safe handles", () => {
    expect(validateUsername("abel.g")).not.toBeNull();
    expect(validateUsername("abel g")).not.toBeNull();
    expect(validateUsername("Abel")).not.toBeNull();
  });
});
