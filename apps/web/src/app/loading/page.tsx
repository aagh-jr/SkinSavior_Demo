import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loading state" };

const pulse = "animate-pulse";

export default function LoadingStatePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-12 py-[18px]">
        <div className="flex items-center gap-[30px]">
          <span className="font-serif text-[23px] font-semibold text-ink">
            skinsavior
          </span>
          <div className="hidden gap-[22px] text-[14px] text-muted-foreground md:flex">
            <span>Products</span>
            <span>Ingredients</span>
            <span>Routines</span>
            <span>Community</span>
          </div>
        </div>
        <div className={`h-[38px] w-[38px] rounded-full bg-[#ece2d3] ${pulse}`} />
      </div>

      <div className="mx-auto w-full max-w-[1180px] flex-1 px-12 py-14">
        <div className="mb-12 flex flex-col items-center gap-3.5">
          <div className={`h-[30px] w-[280px] rounded-lg bg-[#ece2d3] ${pulse}`} />
          <div
            className={`h-[46px] w-[440px] max-w-full rounded-full bg-[#efe7d9] ${pulse}`}
          />
        </div>
        <div className={`mb-[18px] h-[22px] w-[200px] rounded-md bg-[#ece2d3] ${pulse}`} />
        <div className="flex gap-[18px] overflow-hidden">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="w-[258px] flex-shrink-0 overflow-hidden rounded-[16px] border border-[#ece2d3]"
            >
              <div className={`aspect-[4/3] bg-[#ece2d3] ${pulse}`} />
              <div className="flex flex-col gap-2.5 p-3.5">
                <div className={`h-[11px] w-3/5 rounded bg-[#efe7d9] ${pulse}`} />
                <div className={`h-4 w-[90%] rounded bg-[#ece2d3] ${pulse}`} />
                <div className="mt-1 flex justify-between">
                  <div className={`h-[13px] w-10 rounded bg-[#efe7d9] ${pulse}`} />
                  <div className={`h-[18px] w-[60px] rounded-full bg-[#efe7d9] ${pulse}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-center gap-2.5">
          <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-[#e0d3c0] border-t-clay" />
          <span className="text-[13px] text-muted-foreground">
            Loading your matches…
          </span>
        </div>
      </div>
    </div>
  );
}
