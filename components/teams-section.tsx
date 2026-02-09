"use client";

import { useState } from "react";
import type { Team } from "@/lib/league-data";
import { Badge } from "@/components/ui/badge";

function TeamCard({
  team,
  isSelected,
  onClick,
}: {
  team: Team;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border bg-card/30 hover:bg-card/60"
      }`}
    >
      <div
        className="h-8 w-8 rounded-lg"
        style={{ backgroundColor: team.color }}
      />
      <div className="flex-1">
        <div className="text-sm font-bold text-foreground">{team.name}</div>
        <div className="text-xs text-muted-foreground">{team.gm}</div>
      </div>
      <Badge
        variant="outline"
        className="text-[10px] border-border text-muted-foreground"
      >
        {team.conference}
      </Badge>
    </button>
  );
}

function RosterPanel({ team }: { team: Team }) {
  return (
    <div className="rounded-lg border border-border bg-card/30 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg"
          style={{ backgroundColor: team.color }}
        />
        <div>
          <h3 className="text-lg font-bold text-foreground">{team.name}</h3>
          <p className="text-xs text-muted-foreground">
            {team.abbrev} &middot; {team.conference} Conference &middot; GM: {team.gm}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold font-mono text-foreground">
            {team.wins}-{team.losses}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Record
          </div>
        </div>
      </div>

      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Roster
      </div>
      <div className="flex flex-col gap-1.5">
        {team.roster.map((player, i) => (
          <div
            key={`${team.name}-${i}`}
            className="flex items-center gap-3 rounded-md bg-muted/30 px-4 py-2.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-foreground">
              {player}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground italic">
        Rosters update automatically from the Google Sheet after trades or free agency changes.
      </p>
    </div>
  );
}

export function TeamsSection({ teams }: { teams: Team[] }) {
  const westTeams = teams.filter((t) => t.conference === "West");
  const eastTeams = teams.filter((t) => t.conference === "East");
  const [selectedTeam, setSelectedTeam] = useState<Team>(teams[0]);

  return (
    <section id="teams" className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
          Teams & Rosters
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Team list */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Western Conference
            </h3>
            <div className="flex flex-col gap-1.5">
              {westTeams.map((team) => (
                <TeamCard
                  key={team.name}
                  team={team}
                  isSelected={selectedTeam.name === team.name}
                  onClick={() => setSelectedTeam(team)}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Eastern Conference
            </h3>
            <div className="flex flex-col gap-1.5">
              {eastTeams.map((team) => (
                <TeamCard
                  key={team.name}
                  team={team}
                  isSelected={selectedTeam.name === team.name}
                  onClick={() => setSelectedTeam(team)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selected team roster */}
        <RosterPanel team={selectedTeam} />
      </div>
    </section>
  );
}
