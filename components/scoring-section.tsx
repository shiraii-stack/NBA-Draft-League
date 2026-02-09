"use client";

import { useState } from "react";
import type { Team, Game, Matchup } from "@/lib/league-data";
import { getSportBadgeClass } from "@/lib/league-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getTeamColorFromList(teams: Team[], teamName: string): string {
  return teams.find((t) => t.name === teamName)?.color ?? "#888888";
}

function getGameDayLeaderboard(schedule: Game[], gameDayLabel: string) {
  const scores: { player: string; team: string; gameDay: string; score: number }[] = [];
  const game = schedule.find((g) => g.label === gameDayLabel);
  if (!game) return [];

  for (const m of game.matchups) {
    if (m.awayStarters && m.awayStarterScores) {
      m.awayStarters.forEach((player, i) => {
        scores.push({
          player,
          team: m.away,
          gameDay: game.label,
          score: m.awayStarterScores![i] ?? 0,
        });
      });
    }
    if (m.homeStarters && m.homeStarterScores) {
      m.homeStarters.forEach((player, i) => {
        scores.push({
          player,
          team: m.home,
          gameDay: game.label,
          score: m.homeStarterScores![i] ?? 0,
        });
      });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.map((s, i) => ({ ...s, position: i + 1 }));
}

function getPlayerADP(schedule: Game[]) {
  const allScores: { player: string; team: string; gameDay: string; score: number }[] = [];

  for (const game of schedule) {
    if (!game.played) continue;
    for (const m of game.matchups) {
      if (m.awayStarters && m.awayStarterScores) {
        m.awayStarters.forEach((player, i) => {
          allScores.push({
            player,
            team: m.away,
            gameDay: game.label,
            score: m.awayStarterScores![i] ?? 0,
          });
        });
      }
      if (m.homeStarters && m.homeStarterScores) {
        m.homeStarters.forEach((player, i) => {
          allScores.push({
            player,
            team: m.home,
            gameDay: game.label,
            score: m.homeStarterScores![i] ?? 0,
          });
        });
      }
    }
  }

  const gameDays = [...new Set(allScores.map((s) => s.gameDay))];
  const withPositions: (typeof allScores[number] & { position: number })[] = [];
  for (const gd of gameDays) {
    const dayScores = allScores
      .filter((s) => s.gameDay === gd)
      .sort((a, b) => b.score - a.score);
    dayScores.forEach((s, i) => {
      withPositions.push({ ...s, position: i + 1 });
    });
  }

  const playerMap = new Map<string, { team: string; scores: number[]; positions: number[] }>();
  for (const s of withPositions) {
    if (!playerMap.has(s.player)) {
      playerMap.set(s.player, { team: s.team, scores: [], positions: [] });
    }
    const entry = playerMap.get(s.player)!;
    entry.scores.push(s.score);
    entry.positions.push(s.position);
  }

  const results = Array.from(playerMap.entries()).map(([player, data]) => ({
    player,
    team: data.team,
    gamesPlayed: data.scores.length,
    avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    adp: data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
  }));

  results.sort((a, b) => a.adp - b.adp);
  return results;
}

function DraftScoreCard({
  matchup,
  teams,
}: {
  matchup: Matchup;
  teams: Team[];
}) {
  const awayColor = getTeamColorFromList(teams, matchup.away);
  const homeColor = getTeamColorFromList(teams, matchup.home);
  const awayTotal = matchup.awayStarterScores?.reduce((a, b) => a + b, 0) ?? 0;
  const homeTotal = matchup.homeStarterScores?.reduce((a, b) => a + b, 0) ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card/30 p-4">
      {/* Scores header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: awayColor }}
          />
          <span className="text-sm font-bold text-foreground">{matchup.away}</span>
          <span className="font-mono text-lg font-bold text-foreground">
            {awayTotal}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">vs</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-foreground">
            {homeTotal}
          </span>
          <span className="text-sm font-bold text-foreground">{matchup.home}</span>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: homeColor }}
          />
        </div>
      </div>

      {/* Player scores table */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          {matchup.awayStarters?.map((player, i) => (
            <div
              key={`away-${i}`}
              className="flex items-center justify-between rounded bg-muted/20 px-2 py-1"
            >
              <span className="text-xs text-foreground">{player}</span>
              <span className="font-mono text-xs font-bold text-foreground">
                {matchup.awayStarterScores?.[i] ?? 0}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {matchup.homeStarters?.map((player, i) => (
            <div
              key={`home-${i}`}
              className="flex items-center justify-between rounded bg-muted/20 px-2 py-1"
            >
              <span className="text-xs text-foreground">{player}</span>
              <span className="font-mono text-xs font-bold text-foreground">
                {matchup.homeStarterScores?.[i] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Draft links */}
      {(matchup.awayDraftLinks?.length || matchup.homeDraftLinks?.length) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchup.awayDraftLinks?.map((link, i) => (
            <a
              key={`away-link-${i}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-primary transition-colors hover:bg-primary/10"
            >
              {matchup.awayStarters?.[i] ?? `Away ${i + 1}`} Draft
            </a>
          ))}
          {matchup.homeDraftLinks?.map((link, i) => (
            <a
              key={`home-link-${i}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-primary transition-colors hover:bg-primary/10"
            >
              {matchup.homeStarters?.[i] ?? `Home ${i + 1}`} Draft
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function GameDayScoring({
  game,
  schedule,
  teams,
}: {
  game: Game;
  schedule: Game[];
  teams: Team[];
}) {
  const leaderboard = getGameDayLeaderboard(schedule, game.label);
  const hasScores = game.matchups.some(
    (m) => m.awayStarters?.length && m.awayStarterScores?.length
  );

  if (!hasScores) {
    return (
      <div className="rounded-lg border border-border bg-card/20 p-8 text-center text-sm text-muted-foreground">
        No scoring data yet for {game.label}. Starters and draft links will
        appear here once submitted.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {game.matchups
          .filter((m) => m.awayStarters?.length)
          .map((m, i) => (
            <DraftScoreCard key={i} matchup={m} teams={teams} />
          ))}
      </div>

      {leaderboard.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Game Day Leaderboard
          </h4>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="text-xs">Player</TableHead>
                  <TableHead className="text-xs">Team</TableHead>
                  <TableHead className="text-right text-xs">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow
                    key={`${entry.player}-${entry.team}`}
                    className="border-border hover:bg-muted/20"
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {entry.position}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {entry.player}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getTeamColorFromList(teams, entry.team) }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.team}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                      {entry.score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function ADPTable({ schedule, teams }: { schedule: Game[]; teams: Team[] }) {
  const adpData = getPlayerADP(schedule);

  if (adpData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/20 p-8 text-center text-sm text-muted-foreground">
        ADP data will appear here once game day scoring is entered. ADP is the
        average leaderboard position across all game days played.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rank
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Player
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              GP
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Score
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ADP
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adpData.map((entry, i) => (
            <TableRow
              key={entry.player}
              className="border-border hover:bg-muted/20"
            >
              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                {i + 1}
              </TableCell>
              <TableCell className="text-sm font-medium text-foreground">
                {entry.player}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getTeamColorFromList(teams, entry.team) }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.team}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono text-xs">
                {entry.gamesPlayed}
              </TableCell>
              <TableCell className="text-center font-mono text-sm font-bold text-foreground">
                {entry.avgScore.toFixed(1)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm text-primary font-bold">
                {entry.adp.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ScoringSection({
  schedule,
  teams,
}: {
  schedule: Game[];
  teams: Team[];
}) {
  const playedGames = schedule.filter((g) => g.played && !g.label.includes("Preseason"));
  const [selectedGameDay, setSelectedGameDay] = useState<string>(
    playedGames.length > 0 ? playedGames[0].label : ""
  );
  const selectedGame = schedule.find((g) => g.label === selectedGameDay);

  return (
    <section id="scoring" className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
          Live Scoring & Stats
        </h2>
      </div>

      <Tabs defaultValue="gameday" className="w-full">
        <TabsList className="mb-4 bg-muted/50">
          <TabsTrigger
            value="gameday"
            className="text-xs uppercase tracking-wider"
          >
            Game Day Scoring
          </TabsTrigger>
          <TabsTrigger
            value="adp"
            className="text-xs uppercase tracking-wider"
          >
            Player ADP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gameday">
          {playedGames.length > 0 ? (
            <>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {playedGames.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setSelectedGameDay(g.label)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedGameDay === g.label
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.label}
                    <span className="ml-1 text-muted-foreground">({g.date})</span>
                  </button>
                ))}
              </div>
              {selectedGame && (
                <GameDayScoring game={selectedGame} schedule={schedule} teams={teams} />
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border bg-card/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No game days have been completed yet. Once games are played and
                scoring data is entered, game day scoring and draft links will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="adp">
          <p className="mb-4 text-sm text-muted-foreground">
            ADP (Average Draft Position) is calculated by averaging each
            player&apos;s leaderboard position across all game days played. A lower
            ADP is better.
          </p>
          <ADPTable schedule={schedule} teams={teams} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
