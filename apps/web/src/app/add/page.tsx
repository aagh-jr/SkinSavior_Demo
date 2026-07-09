"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ScientistAvatar } from "@/components/ScientistAvatar";

type RowStatus =
  | { state: "pending" }
  | { state: "working" }
  | { state: "done"; slug: string; created: boolean }
  | { state: "error"; message: string };

interface Row {
  url: string;
  status: RowStatus;
}

export default function AddProductPage() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = [...new Set(input.split(/\s+/).map((s) => s.trim()).filter(Boolean))];
    if (!urls.length || running) return;

    const initial: Row[] = urls.map((url) => ({ url, status: { state: "pending" } }));
    setRows(initial);
    setRunning(true);

    // Sequential on purpose: each URL costs a page fetch + a model call.
    for (let i = 0; i < urls.length; i++) {
      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: { state: "working" } } : r)));
      let status: RowStatus;
      try {
        const res = await fetch("/api/products/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urls[i] }),
        });
        const data = await res.json();
        status = res.ok
          ? { state: "done", slug: data.slug, created: data.status === "created" }
          : { state: "error", message: data.error ?? `Failed (HTTP ${res.status})` };
      } catch {
        status = { state: "error", message: "Network error — try again." };
      }
      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status } : r)));
    }
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[720px] px-6 py-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Products / Add</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">
          Add a product by link
        </h1>
        <p className="mt-3 text-muted-foreground">
          Paste a link to a product page (brand site or retailer). If we already know the
          product you&apos;ll be taken to its page; otherwise we&apos;ll read the page and
          build one from the ingredient list.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={"https://example.com/products/vitamin-c-serum\nOne URL per line for multiple products"}
            className="w-full rounded-xl border border-border bg-card p-4 text-sm text-ink outline-none focus:border-primary/60"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={running || !input.trim()}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Analyzing…" : "Analyze link(s)"}
            </button>
            <ScientistAvatar talking={running} />
            {running && (
              <span className="text-sm text-muted-foreground">
                reading the label, decoding ingredients…
              </span>
            )}
          </div>
        </form>

        {rows.length > 0 && (
          <ul className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl border border-border bg-border">
            {rows.map((row) => (
              <li key={row.url} className="flex items-center justify-between gap-4 bg-card px-4 py-3.5">
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{row.url}</span>
                {row.status.state === "pending" && (
                  <span className="text-sm text-muted-foreground">queued</span>
                )}
                {row.status.state === "working" && (
                  <span className="text-sm text-primary">reading page…</span>
                )}
                {row.status.state === "done" && (
                  <Link
                    href={`/product/${row.status.slug}`}
                    className="whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                  >
                    {row.status.created ? "Created — view page →" : "Already known — view page →"}
                  </Link>
                )}
                {row.status.state === "error" && (
                  <span className="text-sm text-destructive">{row.status.message}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Pages created this way are marked <strong>AI-extracted — not yet reviewed</strong>.
          Evidence grading and match scores run in a later pass.
        </p>
      </main>
    </div>
  );
}
