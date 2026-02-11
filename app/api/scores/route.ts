import { NextResponse } from "next/server";
import { fetchDraftEntry } from "@/lib/real-sports";

/**
 * POST /api/scores
 *
 * Accepts a list of matchups with draftId + draft codes,
 * fetches each draft from the Real Sports API, totals the
 * player scores per team, determines winners, and returns
 * the scored matchups + computed standings delta.
 *
 * Body: { matchups: Array<{ gameLabel, home, away, draftId, homeDraftCode, awayDraftCode }> }
 * Response: { results: Array<{ gameLabel, home, away, homeScore, awayScore, winner }>, standings: Record<team, { wins, losses, pf, pa }> }
 */

type MatchupInput = {
  gameLabel: string;
  home: string;
  away: string;
  draftId: number;
  homeDraftCode?: string;
  awayDraftCode?: string;
};

type MatchupResult = {
  gameLabel: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: "home" | "away" | "tie" | null;
  forfeit?: "home" | "away";
  dq?: "home" | "away";
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matchups: MatchupInput[] = body.matchups ?? [];

    if (!matchups.length) {
      return NextResponse.json({ results: [], standings: {} });
    }

    const standings: Record<string, { wins: number; losses: number; pf: number; pa: number }> = {};

    // Process matchups in parallel batches of 4 to avoid overwhelming the API
    const results: MatchupResult[] = [];
    const batchSize = 4;

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
            winner: null,
          };

          const homeLower = (m.homeDraftCode ?? "").toLowerCase();
          const awayLower = (m.awayDraftCode ?? "").toLowerCase();

          // Handle forfeits
          if (homeLower === "forfeit") {
            result.forfeit = "home";
            result.homeScore = 0;
            result.awayScore = 1; // symbolic win
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

          // Handle DQs
          const homeDQ = homeLower === "dq";
          const awayDQ = awayLower === "dq";
          if (homeDQ) result.dq = "home";
          if (awayDQ) result.dq = "away";

          // Fetch drafts from Real Sports API
          const [homeDraft, awayDraft] = await Promise.all([
            m.homeDraftCode && !homeDQ
              ? fetchDraftEntry(m.draftId, m.homeDraftCode)
              : null,
            m.awayDraftCode && !awayDQ
              ? fetchDraftEntry(m.draftId, m.awayDraftCode)
              : null,
          ]);

          if (homeDraft) {
            result.homeScore = homeDraft.totalScore;
          } else if (homeDQ) {
            result.homeScore = 0;
          }

          if (awayDraft) {
            result.awayScore = awayDraft.totalScore;
          } else if (awayDQ) {
            result.awayScore = 0;
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

    // Compute standings from results
    for (const r of results) {
      if (r.homeScore === null && r.awayScore === null) continue;

      if (!standings[r.home]) standings[r.home] = { wins: 0, losses: 0, pf: 0, pa: 0 };
      if (!standings[r.away]) standings[r.away] = { wins: 0, losses: 0, pf: 0, pa: 0 };

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
