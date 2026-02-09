"use client";

import type { Team, Game } from "@/lib/league-data";

export function HeroSection({
  teams,
  schedule,
  seasonLabel,
}: {
  teams: Team[];
  schedule: Game[];
  seasonLabel: string;
}) {
  const totalGames = schedule.filter((g) => !g.label.includes("Preseason")).length;
  const playedGames = schedule.filter((g) => g.played && !g.label.includes("Preseason")).length;

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Season badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {seasonLabel} {playedGames > 0 ? "In Progress" : "Starting Soon"}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-balance text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl lg:text-7xl">
            NBA Draft
            <span className="block text-primary">League</span>
          </h1>

          <p className="mb-8 max-w-lg text-pretty text-sm text-muted-foreground md:text-base">
            {teams.length} teams. {totalGames} game days. 2 conferences. One
            champion. The ultimate competitive draft league experience.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-12">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-foreground md:text-4xl">
                {teams.length}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Teams
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-foreground md:text-4xl">
                {totalGames}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Game Days
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-foreground md:text-4xl">
                {playedGames}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
