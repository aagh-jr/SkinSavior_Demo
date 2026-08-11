---
name: run-web
description: Build, launch, and screenshot the skinsavior Next.js web app (apps/web). Use when asked to run, start, serve, screenshot, or visually verify the web app / a page / a product screen locally.
---

# Run: skinsavior web (apps/web)

`apps/web` is a Next.js 15 app in a Bun + Turborepo monorepo. It's
server-rendered — every screen has a URL — so you drive it by loading a
route headless and screenshotting it. The driver is
[`.claude/skills/run-web/driver.sh`](driver.sh): a thin wrapper around
the machine's Chrome/Chromium in `--headless --screenshot` mode (no
`chromium-cli`, no npm install).

**All paths below are relative to `apps/web/`.** The dev server is
launched from the **repo root** (one level up); everything else runs
from `apps/web`.

## Prerequisites

- **Bun** (this repo's package manager). It installs to `~/.bun/bin`,
  which is usually NOT on a non-interactive shell's PATH — prefix it:
  ```bash
  export PATH="$HOME/.bun/bin:$PATH"
  ```
- **Google Chrome** (already present at
  `/Applications/Google Chrome.app` on macOS). The driver also finds
  `google-chrome`/`chromium` on PATH.
- **`apps/web/.env.local`** with Supabase keys — the DB-backed pages
  (`/search`, `/product/*`, `/ingredients`) read Supabase and error
  without them. Required names: `SUPABASE_URL` (or
  `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Build / install

From the **repo root**. If you switched branches or see a "Module not
found" for a package that should exist, do the clean reinstall — a
half-written `node_modules` is the usual cause (see Gotchas):

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun install
```

## Run — agent path (the driver)

1. **Start the dev server** from the **repo root**, in the background:
   ```bash
   export PATH="$HOME/.bun/bin:$PATH"
   bun run dev            # turbo run dev -> next dev on http://localhost:3000
   ```
   First boot is ~45s ("Ready in …"), and the first hit to each route
   triggers an on-demand compile (30–100s) before it responds.

2. **Drive it** from `apps/web`:
   ```bash
   ./.claude/skills/run-web/driver.sh check   # assert server is up (HTTP 200)
   ./.claude/skills/run-web/driver.sh tour    # screenshot the key screens
   ./.claude/skills/run-web/driver.sh shot search              # one route
   ./.claude/skills/run-web/driver.sh shot product/<slug> prod # route + name
   ```
   Screenshots land in `$TMPDIR/skinsavior-shots/` (override with
   `OUT_DIR=...`). They're throwaway — **don't commit them.** After a
   `shot`, actually open the PNG; a blank/error image means the route
   was still compiling — re-run it.

`tour` captures `/home`, `/search`, `/ingredients`, and a product page.
Override the target with `BASE_URL=...` (e.g. a preview deploy).

## Run — human path

`bun run dev` from the repo root, then open http://localhost:3000 in a
real browser. Same server; the driver just automates the screenshotting.

## Test / typecheck

From `apps/web`:
```bash
bun run typecheck    # tsc --noEmit
bun run lint         # next lint
```

## Gotchas

- **`command not found: bun`** in scripts/tools: Bun isn't on the
  non-interactive PATH. Prefix every command with
  `export PATH="$HOME/.bun/bin:$PATH"`.
- **`Module not found: Can't resolve '@supabase/storage-js'`** (or a
  similar in-tree package) on first run: the installed `node_modules`
  is corrupted — look for a package whose `dist/` has odd permissions
  or a duplicate `dist 2/` folder. Fix with a clean reinstall from the
  repo root:
  ```bash
  rm -rf node_modules apps/web/node_modules apps/mobile/node_modules packages/*/node_modules
  export PATH="$HOME/.bun/bin:$PATH"; bun install
  ```
  Then delete the stale build cache: `rm -rf apps/web/.next`.
- **First screenshot of a route is blank or shows an error page:** Next
  dev compiles routes on demand, so the *first* request to each path is
  slow. The driver waits, but a very slow first compile can still beat
  it — just re-run the same `shot`.
- **`turbo run dev` starts all 4 workspace packages;** only
  `@skinsavior/web` listens on :3000. That's expected noise in the log.
- **No `chromium-cli` on this machine** — the driver uses the Chrome.app
  binary directly. That's why the harness is a shell script, not a
  `chromium-cli` heredoc.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `driver.sh check` → `DOWN … HTTP 000` | Server isn't up. Start `bun run dev` from repo root (with Bun on PATH). |
| `ERROR: no Chrome/Chromium found` | Install Google Chrome, or put `chromium` on PATH. |
| DB pages 500 / empty | `apps/web/.env.local` missing Supabase keys (see Prerequisites). |
| Screenshot is the placeholder-icon, no photos | Expected for products whose `image_url` is null in the DB; not a driver bug. |
