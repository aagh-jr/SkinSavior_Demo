# skinsavior — working context

The working context is shared with Codex and lives in **AGENTS.md**, imported
below so it loads automatically each session. Keep edits in `AGENTS.md`, not
here, so both tools stay in sync. Claude-only notes (if any) go under the rule.

@AGENTS.md

---

## Claude-only notes

- Longer-form docs live in `docs/` (`ideas/`, `prompts/`, `specs/`, `assets/`).
- When adding UI, follow **File types and where they go** in AGENTS.md: visual
  components never fetch; data access goes in a `use*` hook or a `-db.ts`
  module; every new visual component gets a `*.stories.tsx`.
