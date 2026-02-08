"use client";

import type { Team, TeamDraftCapital } from "@/lib/league-data";
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

function getDraftOrder(teams: Team[]) {
  return [...teams].sort((a, b) => {
    const winPctA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0.5;
    const winPctB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0.5;
    if (winPctA !== winPctB) return winPctA - winPctB;
    return a.wins - b.wins;
  });
}

function DraftOrderTable({ teams }: { teams: Team[] }) {
  const order = getDraftOrder(teams);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pick
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Record
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((entry, i) => (
            <TableRow key={entry.name} className="border-border hover:bg-muted/20">
              <TableCell className="text-center">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {i + 1}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-semibold text-foreground">
                    {entry.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono text-sm text-muted-foreground">
                {entry.wins}-{entry.losses}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeamCapitalCard({
  teamName,
  teams,
  draftCapital,
}: {
  teamName: string;
  teams: Team[];
  draftCapital: TeamDraftCapital[];
}) {
  const capital = draftCapital.find((d) => d.team === teamName);
  const teamColor = teams.find((t) => t.name === teamName)?.color ?? "#888888";

  if (!capital) return null;

  return (
    <div className="rounded-lg border border-border bg-card/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div
          className="h-4 w-4 rounded"
          style={{ backgroundColor: teamColor }}
        />
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {teamName}
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {capital.seasons.map((season) => (
          <div key={season.season}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {season.season}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {season.picks.map((pick, i) => {
                const isTraded = pick.origin !== teamName;
                return (
                  <Badge
                    key={`${season.season}-${i}`}
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      isTraded
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {pick.round}
                    {isTraded && (
                      <span className="ml-1 opacity-70">
                        via {pick.origin}
                      </span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DraftSection({
  teams,
  draftCapital,
}: {
  teams: Team[];
  draftCapital: TeamDraftCapital[];
}) {
  return (
    <section id="draft" className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">
          Draft Capital
        </h2>
      </div>

      <Tabs defaultValue="order" className="w-full">
        <TabsList className="mb-4 bg-muted/50">
          <TabsTrigger
            value="order"
            className="text-xs uppercase tracking-wider"
          >
            S2 Draft Order
          </TabsTrigger>
          <TabsTrigger
            value="capital"
            className="text-xs uppercase tracking-wider"
          >
            All Draft Capital
          </TabsTrigger>
        </TabsList>
        <TabsContent value="order">
          <p className="mb-4 text-sm text-muted-foreground">
            The team with the worst regular season record in Season 1 gets the
            #1 overall pick in the Season 2 draft.
          </p>
          <DraftOrderTable teams={teams} />
        </TabsContent>
        <TabsContent value="capital">
          <p className="mb-4 text-sm text-muted-foreground">
            Picks highlighted in orange were acquired via trade. All teams start
            with picks in rounds 1-5 each season.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((t) => (
              <TeamCapitalCard
                key={t.name}
                teamName={t.name}
                teams={teams}
                draftCapital={draftCapital}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
