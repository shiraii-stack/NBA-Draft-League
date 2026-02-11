"use client";

import { useState, useEffect, useCallback } from "react";
import type { Team, Game, TeamDraftCapital } from "@/lib/league-data";
import { LeagueNav } from "@/components/league-nav";
import { HeroSection } from "@/components/hero-section";
import { StandingsSection } from "@/components/standings-section";
import { ScheduleSection } from "@/components/schedule-section";
import { TeamsSection } from "@/components/teams-section";
import { DraftSection } from "@/components/draft-section";
import { ScoringSection } from "@/components/scoring-section";

type ScoreResult = {
  gameLabel: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: "home" | "away" | "tie" | null;
};

type StandingsDelta = Record<
  string,
  { wins: number; losses: number; pf: number; pa: number }
>;

export function SeasonDashboard({
  seasonId,
  seasonLabel,
  teams: initialTeams,
  schedule: initialSchedule,
  draftCapital,
}: {
  seasonId: number;
  seasonLabel: string;
  teams: Team[];
  schedule: Game[];
  draftCapital: TeamDraftCapital[];
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [scoresLoading, setScoresLoading] = useState(false);

  // Collect all matchups that need scoring (have draftId + codes, but no scores yet)
  const collectUnscoredMatchups = useCallback(() => {
    const matchups: {
      gameLabel: string;
      home: string;
      away: string;
      draftId: number;
      homeDraftCode?: string;
      awayDraftCode?: string;
    }[] = [];

    for (const game of initialSchedule) {
      // Skip preseason
      if (game.label.toLowerCase().includes("preseason")) continue;

      for (const m of game.matchups) {
        // Only score matchups with a draftId and at least one draft code, and no scores yet
        if (
          m.draftId &&
          (m.homeDraftCode || m.awayDraftCode) &&
          m.homeScore === undefined &&
          m.awayScore === undefined
        ) {
          matchups.push({
            gameLabel: game.label,
            home: m.home,
            away: m.away,
            draftId: m.draftId,
            homeDraftCode: m.homeDraftCode,
            awayDraftCode: m.awayDraftCode,
          });
        }
      }
    }

    return matchups;
  }, [initialSchedule]);

  // Fetch scores from API and apply them
  useEffect(() => {
    const unscoredMatchups = collectUnscoredMatchups();
    if (unscoredMatchups.length === 0) {
      console.log("[v0] No unscored matchups with draft codes found");
      return;
    }

    console.log("[v0] Fetching scores for", unscoredMatchups.length, "matchups");
    setScoresLoading(true);

    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchups: unscoredMatchups }),
    })
      .then((res) => res.json())
      .then((data: { results: ScoreResult[]; standings: StandingsDelta }) => {
        console.log("[v0] Score results:", data.results.length, "standings:", Object.keys(data.standings));

        // Apply scores to schedule
        const resultMap = new Map<string, ScoreResult>();
        for (const r of data.results) {
          resultMap.set(`${r.gameLabel}|${r.away}|${r.home}`, r);
        }

        const updatedSchedule = initialSchedule.map((game) => ({
          ...game,
          matchups: game.matchups.map((m) => {
            const key = `${game.label}|${m.away}|${m.home}`;
            const result = resultMap.get(key);
            if (result && result.homeScore !== null && result.awayScore !== null) {
              return {
                ...m,
                homeScore: result.homeScore,
                awayScore: result.awayScore,
              };
            }
            return m;
          }),
          played:
            game.played ||
            game.matchups.some((m) => {
              const key = `${game.label}|${m.away}|${m.home}`;
              const result = resultMap.get(key);
              return result && result.homeScore !== null && result.awayScore !== null;
            }),
        }));

        setSchedule(updatedSchedule);

        // Apply standings delta on top of sheet baseline
        if (Object.keys(data.standings).length > 0) {
          const updatedTeams = initialTeams.map((team) => {
            const delta = data.standings[team.name];
            if (!delta || (delta.wins === 0 && delta.losses === 0)) return team;
            return {
              ...team,
              wins: team.wins + delta.wins,
              losses: team.losses + delta.losses,
            };
          });
          setTeams(updatedTeams);
        }
      })
      .catch((err) => {
        console.error("[v0] Failed to fetch scores:", err);
      })
      .finally(() => {
        setScoresLoading(false);
      });
  }, [initialSchedule, initialTeams, collectUnscoredMatchups]);

  return (
    <div className="min-h-screen bg-background">
      <LeagueNav seasonLabel={seasonLabel} />
      <HeroSection teams={teams} schedule={schedule} seasonLabel={seasonLabel} />
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {scoresLoading && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm text-primary">Calculating live scores from draft data...</span>
          </div>
        )}
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
