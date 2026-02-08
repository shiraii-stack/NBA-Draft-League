"use client";

import type { Team } from "@/lib/league-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function sortStandings(teamsList: Team[], conference?: "West" | "East") {
  const filtered = conference
    ? teamsList.filter((t) => t.conference === conference)
    : teamsList;
  return [...filtered].sort((a, b) => {
    const winPctA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const winPctB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    if (winPctB !== winPctA) return winPctB - winPctA;
    return b.wins - a.wins;
  });
}

function StandingsTable({
  teams,
  conference,
}: {
  teams: Team[];
  conference?: "West" | "East";
}) {
  const standings = sortStandings(teams, conference);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              #
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              W
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              L
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PCT
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              GM
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((team, i) => {
            const pct =
              team.wins + team.losses > 0
                ? (team.wins / (team.wins + team.losses)).toFixed(3)
                : ".000";
            return (
              <TableRow
                key={team.name}
                className="border-border transition-colors hover:bg-muted/20"
              >
                <TableCell className="text-center font-mono text-sm text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <span className="font-semibold text-foreground">
                        {team.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {team.abbrev}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {team.wins}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {team.losses}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {pct}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {team.gm}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function StandingsSection({ teams }: { teams: Team[] }) {
  return (
    <section id="standings" className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
          Standings
        </h2>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 bg-muted/50">
          <TabsTrigger value="all" className="text-xs uppercase tracking-wider">
            All Teams
          </TabsTrigger>
          <TabsTrigger value="west" className="text-xs uppercase tracking-wider">
            West
          </TabsTrigger>
          <TabsTrigger value="east" className="text-xs uppercase tracking-wider">
            East
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <StandingsTable teams={teams} />
        </TabsContent>
        <TabsContent value="west">
          <StandingsTable teams={teams} conference="West" />
        </TabsContent>
        <TabsContent value="east">
          <StandingsTable teams={teams} conference="East" />
        </TabsContent>
      </Tabs>
    </section>
  );
}
