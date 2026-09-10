# Ideas for later

A running list of deferred ideas — things we intentionally chose not to build yet,
with enough context to pick them up later.

## 1. Optional stronger ingest fallback trigger (zero-ingredients retry)

We could also fall back when Claude extraction succeeds but finds zero ingredients — since ingredients are what power the dedup. But that costs a second Claude extraction on retry. The content-length heuristic above catches most cases without that extra cost, so I'd start without it and add it later only if pages slip through. Flagging so it's your decision, not a silent one.
