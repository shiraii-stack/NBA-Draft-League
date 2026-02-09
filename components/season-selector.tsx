"use client";

import Link from "next/link";
import type { SeasonConfig } from "@/lib/seasons-config";

export function SeasonSelector({ seasons }: { seasons: SeasonConfig[] }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">DL</span>
          </div>
        </div>

        <h1 className="mb-2 text-balance text-center text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl lg:text-6xl">
          NBA Draft
          <span className="block text-primary">League</span>
        </h1>

        <p className="mb-10 text-center text-sm text-muted-foreground md:text-base">
          Select a season to view standings, schedule, rosters, and more.
        </p>

        {/* Season cards */}
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          {seasons.map((season) => {
            if (season.locked) {
              return (
                <div
                  key={season.id}
                  className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/20 px-6 py-8 opacity-50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-muted-foreground"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {season.label}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {season.description}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={season.id}
                href={`/season/${season.id}`}
                className="group relative flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-6 py-8 transition-all hover:border-primary/60 hover:bg-primary/10 hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 transition-colors group-hover:bg-primary/30">
                  <span className="text-xl font-black text-primary">
                    {season.id}
                  </span>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {season.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {season.description}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    Active
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
