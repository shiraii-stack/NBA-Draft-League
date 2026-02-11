import { NextResponse } from "next/server";
import { fetchDraftEntry } from "@/lib/real-sports";

/**
 * POST /api/scores
 *
 * Accepts matchups with draftId + arrays of player draft user IDs (one per
 * player in each team's starting 5). Fetches each individual player's draft
 * from the Real Sports API, sums scores per team, determines winners.
 *
 * Body: { matchups: Array<{ gameLabel, home, away, draftId, homeDraftLinks, awayDraftLinks }> }
 */

type MatchupInput = {
  gameLabel: string;
  home: string;
  away: string;
  draftId: number;
  homeDraftLinks?: string[];
  awayDraftLinks?: string[];
};

type PlayerScore = {
  userId: string;
  userName: string;
  score: number;
  players: { name: string; score: number; multiplier: string }[];
};

type MatchupResult = {
  gameLabel: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homePlayerScores: PlayerScore[];
  awayPlayerScores: PlayerScore[];
  winner: "home" | "away" | "tie" | null;
  forfeit?: "home" | "away";
  dq?: "home" | "away";
};

/** Fetch one player's draft and return a summary */
async function fetchPlayerScore(
  draftId: number,
  userId: string,
): Promise<PlayerScore | null> {
  try {
    const draft = await fetchDraftEntry(draftId, userId);
    if (!draft) return null;
    return {
      userId,
      userName: draft.userName,
      score: draft.totalScore,
      players: draft.lineup.map((p) => ({
        name: p.displayName,
        score: p.score,
        multiplier: p.multiplierDisplay,
      })),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matchups: MatchupInput[] = body.matchups ?? [];

    if (!matchups.length) {
      return NextResponse.json({ results: [], standings: {} });
    }

    const standings: Record<
      string,
      { wins: number; losses: number; pf: number; pa: number }
    > = {};

    // Process matchups in batches of 2 (each matchup may trigger up to 10 API calls)
    const results: MatchupResult[] = [];
    const batchSize = 2;

    for (let i = 0; i < matchups.length; i += batchSize) {
      const batch = matchups.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (m): Promise<MatchupResult> => {
          const result: MatchupResult = {
            gameLabel: m.gameLabel,
            home: m.home,
            away: m.away,
            homeScore: null,
            awayScore: null,
            homePlayerScores: [],
            awayPlayerScores: [],
            winner: null,
          };

          const homeLinks = m.homeDraftLinks ?? [];
          const awayLinks = m.awayDraftLinks ?? [];

          // Check for FORFEIT / DQ (stored as single-element arrays)
          const homeLower = homeLinks[0]?.toLowerCase() ?? "";
          const awayLower = awayLinks[0]?.toLowerCase() ?? "";

          if (homeLower === "forfeit") {
            result.forfeit = "home";
            result.homeScore = 0;
            result.awayScore = 1;
            result.winner = "away";
            return result;
          }
          if (awayLower === "forfeit") {
            result.forfeit = "away";
            result.awayScore = 0;
            result.homeScore = 1;
            result.winner = "home";
            return result;
          }

          const homeDQ = homeLower === "dq";
          const awayDQ = awayLower === "dq";
          if (homeDQ) result.dq = "home";
          if (awayDQ) result.dq = "away";

          // Fetch all player drafts in parallel
          const validHomeLinks = homeDQ
            ? []
            : homeLinks.filter(
                (l) => l && !["forfeit", "dq"].includes(l.toLowerCase()),
              );
          const validAwayLinks = awayDQ
            ? []
            : awayLinks.filter(
                (l) => l && !["forfeit", "dq"].includes(l.toLowerCase()),
              );

          const [homeScores, awayScores] = await Promise.all([
            Promise.all(
              validHomeLinks.map((code) => fetchPlayerScore(m.draftId, code)),
            ),
            Promise.all(
              validAwayLinks.map((code) => fetchPlayerScore(m.draftId, code)),
            ),
          ]);

          const homePlayerScores = homeScores.filter(Boolean) as PlayerScore[];
          const awayPlayerScores = awayScores.filter(Boolean) as PlayerScore[];

          result.homePlayerScores = homePlayerScores;
          result.awayPlayerScores = awayPlayerScores;

          // Sum total scores per team
          if (homePlayerScores.length > 0 || homeDQ) {
            result.homeScore = homeDQ
              ? 0
              : homePlayerScores.reduce((sum, p) => sum + p.score, 0);
          }
          if (awayPlayerScores.length > 0 || awayDQ) {
            result.awayScore = awayDQ
              ? 0
              : awayPlayerScores.reduce((sum, p) => sum + p.score, 0);
          }

          // Determine winner
          if (result.homeScore !== null && result.awayScore !== null) {
            result.winner =
              result.homeScore > result.awayScore
                ? "home"
                : result.awayScore > result.homeScore
                  ? "away"
                  : "tie";
          }

          return result;
        }),
      );
      results.push(...batchResults);
    }

    // Compute standings delta from results
    for (const r of results) {
      if (r.homeScore === null && r.awayScore === null) continue;

      if (!standings[r.home])
        standings[r.home] = { wins: 0, losses: 0, pf: 0, pa: 0 };
      if (!standings[r.away])
        standings[r.away] = { wins: 0, losses: 0, pf: 0, pa: 0 };

      if (r.homeScore !== null) {
        standings[r.home].pf += r.homeScore;
        standings[r.away].pa += r.homeScore;
      }
      if (r.awayScore !== null) {
        standings[r.away].pf += r.awayScore;
        standings[r.home].pa += r.awayScore;
      }
      if (r.winner === "home") {
        standings[r.home].wins++;
        standings[r.away].losses++;
      } else if (r.winner === "away") {
        standings[r.away].wins++;
        standings[r.home].losses++;
      }
    }

    return NextResponse.json({ results, standings });
  } catch (error) {
    console.error("Score calculation failed:", error);
    return NextResponse.json(
      { error: "Score calculation failed" },
      { status: 500 },
    );
  }
}
