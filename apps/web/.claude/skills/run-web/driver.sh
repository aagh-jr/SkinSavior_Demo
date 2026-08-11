#!/usr/bin/env bash
# Headless-browser driver for the skinsavior web app (apps/web).
#
# The app is a Next.js server-rendered site: every meaningful screen is
# reachable by URL, so "driving" it means loading a route headless and
# screenshotting the result. This wraps whatever Chrome/Chromium is on the
# machine in its built-in `--headless --screenshot` mode (no npm install,
# no chromium-cli needed).
#
# Usage:
#   ./driver.sh check                 # assert the dev server is up
#   ./driver.sh shot <route> [name]   # screenshot one route
#   ./driver.sh tour                  # screenshot the key screens
#
# Env:
#   BASE_URL   default http://localhost:3000
#   OUT_DIR    default $TMPDIR/skinsavior-shots  (screenshots are throwaway;
#              do NOT commit them)
#   WIDTHxHT   default 1280x1600
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
OUT_DIR="${OUT_DIR:-${TMPDIR:-/tmp}/skinsavior-shots}"
SIZE="${SIZE:-1280,1600}"

find_chrome() {
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)" \
    "$(command -v chromium-browser 2>/dev/null || true)"; do
    [ -n "$c" ] && [ -x "$c" ] && { echo "$c"; return 0; }
  done
  echo "ERROR: no Chrome/Chromium found. Install Google Chrome." >&2
  return 1
}

check() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "$BASE_URL/home" || true)
  if [ "$code" = "200" ]; then
    echo "OK  $BASE_URL is up (HTTP 200)"
  else
    echo "DOWN  $BASE_URL/home -> HTTP $code" >&2
    echo "Start it first:  (from repo root)  PATH=\"\$HOME/.bun/bin:\$PATH\" bun run dev" >&2
    return 1
  fi
}

shot() {
  local route="$1" name="${2:-}"
  [ -z "$name" ] && name="$(echo "$route" | tr '/?=&' '____' | sed 's/^_//; s/_*$//')"
  [ -z "$name" ] && name="home"
  mkdir -p "$OUT_DIR"
  local chrome out; chrome="$(find_chrome)"; out="$OUT_DIR/$name.png"
  "$chrome" --headless --disable-gpu --hide-scrollbars \
    --window-size="$SIZE" --screenshot="$out" "$BASE_URL/$route" >/dev/null 2>&1 || true
  if [ -s "$out" ]; then echo "shot  $route -> $out"; else
    echo "FAILED to screenshot $route" >&2; return 1; fi
}

tour() {
  check
  shot "home" home
  shot "search" search
  shot "ingredients" ingredients
  shot "product/biossance-squalane-omega-repair-cream" product
  echo "---"; echo "screenshots in: $OUT_DIR"
}

cmd="${1:-tour}"; shift || true
case "$cmd" in
  check) check ;;
  shot)  shot "$@" ;;
  tour)  tour ;;
  *) echo "usage: driver.sh {check|shot <route> [name]|tour}" >&2; exit 2 ;;
esac
