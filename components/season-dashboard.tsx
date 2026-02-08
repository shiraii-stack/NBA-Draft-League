"use client";

import type { Team, Game, TeamDraftCapital } from "@/lib/league-data";
import { LeagueNav } from "@/components/league-nav";
import { HeroSection } from "@/components/hero-section";
import { StandingsSection } from "@/components/standings-section";
import { ScheduleSection } from "@/components/schedule-section";
import { TeamsSection } from "@/components/teams-section";
import { DraftSection } from "@/components/draft-section";
import { ScoringSection } from "@/components/scoring-section";

export function SeasonDashboard({
  seasonId,
  seasonLabel,
  teams,
  schedule,
  draftCapital,
}: {
  seasonId: number;
  seasonLabel: string;
  teams: Team[];
  schedule: Game[];
  draftCapital: TeamDraftCapital[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <LeagueNav seasonLabel={seasonLabel} />
      <HeroSection teams={teams} schedule={schedule} seasonLabel={seasonLabel} />
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex flex-col gap-16">
          <StandingsSection teams={teams} schedule={schedule} />
          <ScheduleSection schedule={schedule} teams={teams} />
          <TeamsSection teams={teams} />
          <DraftSection teams={teams} draftCapital={draftCapital} />
          <ScoringSection schedule={schedule} teams={teams} />
        </div>
      </main>
      <footer className="border-t border-border bg-card/30 py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
                <span className="text-[10px] font-bold text-primary-foreground">
                  DL
                </span>
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                NBA Draft League
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {seasonLabel} &middot; Data synced from Google Sheets
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
