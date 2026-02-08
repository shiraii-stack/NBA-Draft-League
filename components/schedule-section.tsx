"use client";

import { useState } from "react";
import type { Team, Game } from "@/lib/league-data";
import { getSportBadgeClass } from "@/lib/league-data";
import { Badge } from "@/components/ui/badge";

function getTeamColorFromList(teams: Team[], teamName: string): string {
  return teams.find((t) => t.name === teamName)?.color ?? "#888888";
}

// Group schedule by month for calendar view
function getCalendarDays(schedule: Game[]) {
  const days: { date: number; month: number; monthName: string; games: Game[] }[] = [];

  // January days (26-31)
  for (let d = 26; d <= 31; d++) {
    const dateStr = `1/${d}`;
    const gamesToday = schedule.filter((g) => g.date === dateStr);
    days.push({ date: d, month: 1, monthName: "January", games: gamesToday });
  }

  // February days (1-28)
  for (let d = 1; d <= 28; d++) {
    const dateStr = `2/${d}`;
    const gamesToday = schedule.filter((g) => g.date === dateStr);
    days.push({ date: d, month: 2, monthName: "February", games: gamesToday });
  }

  return days;
}

function MatchupCard({
  game,
  matchup,
  teams,
}: {
  game: Game;
  matchup: Game["matchups"][0];
  teams: Team[];
}) {
  const awayColor = getTeamColorFromList(teams, matchup.away);
  const homeColor = getTeamColorFromList(teams, matchup.home);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 transition-colors hover:bg-card">
      <div className="flex flex-1 items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: awayColor }}
        />
        <span className="text-sm font-semibold text-foreground">{matchup.away}</span>
        {matchup.awayScore !== undefined && (
          <span className="ml-auto font-mono text-sm font-bold text-foreground">
            {matchup.awayScore}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground">vs</span>
      <div className="flex flex-1 items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: homeColor }}
        />
        <span className="text-sm font-semibold text-foreground">{matchup.home}</span>
        {matchup.homeScore !== undefined && (
          <span className="ml-auto font-mono text-sm font-bold text-foreground">
            {matchup.homeScore}
          </span>
        )}
      </div>
      {game.played && matchup.awayScore !== undefined && matchup.homeScore !== undefined && (
        <Badge
          variant="outline"
          className="ml-2 border-primary/30 bg-primary/10 text-primary text-[10px]"
        >
          FINAL
        </Badge>
      )}
    </div>
  );
}

export function ScheduleSection({
  schedule,
  teams,
}: {
  schedule: Game[];
  teams: Team[];
}) {
  const calendarDays = getCalendarDays(schedule);
  const [selectedDay, setSelectedDay] = useState<(typeof calendarDays)[0] | null>(
    calendarDays.find((d) => d.games.length > 0) ?? null
  );
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Split into Jan / Feb
  const janDays = calendarDays.filter((d) => d.month === 1);
  const febDays = calendarDays.filter((d) => d.month === 2);

  return (
    <section id="schedule" className="scroll-mt-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
            Schedule
          </h2>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              viewMode === "calendar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1.2fr]">
          {/* January */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              January 2025
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {janDays.map((day) => {
                const hasGames = day.games.length > 0;
                const isSelected =
                  selectedDay?.date === day.date && selectedDay?.month === day.month;
                return (
                  <button
                    type="button"
                    key={`jan-${day.date}`}
                    onClick={() => hasGames && setSelectedDay(day)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasGames
                          ? "bg-card text-foreground hover:bg-muted cursor-pointer"
                          : "text-muted-foreground/40 cursor-default"
                    }`}
                  >
                    {day.date}
                    {hasGames && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* February */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              February 2025
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {febDays.map((day) => {
                const hasGames = day.games.length > 0;
                const isSelected =
                  selectedDay?.date === day.date && selectedDay?.month === day.month;
                return (
                  <button
                    type="button"
                    key={`feb-${day.date}`}
                    onClick={() => hasGames && setSelectedDay(day)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasGames
                          ? "bg-card text-foreground hover:bg-muted cursor-pointer"
                          : "text-muted-foreground/40 cursor-default"
                    }`}
                  >
                    {day.date}
                    {hasGames && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day details */}
          <div className="rounded-lg border border-border bg-card/30 p-5">
            {selectedDay && selectedDay.games.length > 0 ? (
              <>
                {selectedDay.games.map((game) => (
                  <div key={game.id} className="mb-4 last:mb-0">
                    <div className="mb-3 flex items-center gap-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {game.label}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        ({game.date})
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getSportBadgeClass(game.sport)}`}
                      >
                        {game.sport}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {game.matchups.map((m, i) => (
                        <MatchupCard
                          key={`${game.id}-${i}`}
                          game={game}
                          matchup={m}
                          teams={teams}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a game day to see matchups
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="flex flex-col gap-6">
          {schedule.map((game) => (
            <div
              key={game.id}
              className="rounded-lg border border-border bg-card/30 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {game.label}
                </h4>
                <span className="text-xs text-muted-foreground">
                  ({game.date})
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${getSportBadgeClass(game.sport)}`}
                >
                  {game.sport}
                </Badge>
                {game.played && (
                  <Badge className="ml-auto bg-primary/20 text-primary text-[10px]">
                    Completed
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {game.matchups.map((m, i) => (
                  <MatchupCard
                    key={`${game.id}-${i}`}
                    game={game}
                    matchup={m}
                    teams={teams}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
