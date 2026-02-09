// ============================================================
// AUTOMATIC SCORE CALCULATOR
// For each matchup that has draft codes (HomeLink / AwayLink),
// fetches the Real Sports API to get total scores, determines
// winners, and computes standings automatically.
//
// IMPORTANT: The Google Sheet Standings tab contains the
// baseline W/L after Game 6. This calculator only adds results
// from games that have draft codes in the schedule (Game 7+).
// The final standings = Sheet standings + computed new results.
//
// Special rules already accounted for in the schedule:
//   - Forfeits: rows with "FORFEIT" in HomeLink or AwayLink
//   - DQ drafts: rows with "DQ" in HomeLink or AwayLink
//     (DQ'd team's score = 0 for that matchup)
// ============================================================

import { fetchDraftEntry } from "@/lib/real-sports";
import type { Team, Game, Matchup } from "@/lib/league-data";

export type ScoredMatchup = Matchup & {
  homeTotal?: number;
  awayTotal?: number;
  winner?: "home" | "away" | "tie";
  homeDraftFetched?: boolean;
  awayDraftFetched?: boolean;
  forfeit?: "home" | "away";
  dq?: "home" | "away";
};

export type ScoredGame = Omit<Game, "matchups"> & {
  matchups: ScoredMatchup[];
};

export type ComputedStandings = Record<
  string,
  { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
>;

/**
 * Fetches Real Sports draft data for all matchups that have draft codes,
 * calculates total scores, and returns the scored schedule + computed NEW standings.
 * Only matchups with draftId + at least one draft code are scored via API.
 * Matchups that already have homeScore/awayScore set (from the sheet) are kept as-is.
 */
export async function calculateScores(
  schedule: Game[],
  _teams: Team[],
): Promise<{ scoredSchedule: ScoredGame[]; newWins: ComputedStandings }> {
  // Track only NEW wins/losses from draft-scored games
  const newWins: ComputedStandings = {};

  const scoredSchedule: ScoredGame[] = [];

  for (const game of schedule) {
    const isPreseason = game.label.toLowerCase().includes("preseason");

    // Process all matchups in parallel
    const matchupPromises = game.matchups.map(
      async (matchup): Promise<ScoredMatchup> => {
        const scored: ScoredMatchup = { ...matchup };

        // Check for forfeit markers in the draft code fields
        const homeLower = (matchup.homeDraftCode ?? "").toLowerCase();
        const awayLower = (matchup.awayDraftCode ?? "").toLowerCase();

        if (homeLower === "forfeit" || awayLower === "forfeit") {
          // The team that forfeited loses, opponent wins
          const forfeitSide = homeLower === "forfeit" ? "home" : "away";
          scored.forfeit = forfeitSide;
          scored.homeScore = forfeitSide === "home" ? 0 : undefined;
          scored.awayScore = forfeitSide === "away" ? 0 : undefined;
          scored.winner = forfeitSide === "home" ? "away" : "home";
          // Give the non-forfeiting team the W even without a score
          if (scored.homeScore === undefined) scored.homeScore = 1;
          if (scored.awayScore === undefined) scored.awayScore = 1;
          if (forfeitSide === "home") {
            scored.homeScore = 0;
          } else {
            scored.awayScore = 0;
          }
          return scored;
        }

        // If scores are already set (from the sheet), use those
        if (
          matchup.homeScore !== undefined &&
          matchup.awayScore !== undefined
        ) {
          scored.homeTotal = matchup.homeScore;
          scored.awayTotal = matchup.awayScore;
          scored.winner =
            matchup.homeScore > matchup.awayScore
              ? "home"
              : matchup.awayScore > matchup.homeScore
                ? "away"
                : "tie";
          return scored;
        }

        // If we have draft codes + draftId, fetch from Real Sports API
        if (
          matchup.draftId &&
          (matchup.homeDraftCode || matchup.awayDraftCode)
        ) {
          try {
            // Check for DQ markers
            const homeDQ = homeLower === "dq";
            const awayDQ = awayLower === "dq";

            if (homeDQ) scored.dq = "home";
            if (awayDQ) scored.dq = "away";

            const [homeDraft, awayDraft] = await Promise.all([
              matchup.homeDraftCode && !homeDQ
                ? fetchDraftEntry(matchup.draftId, matchup.homeDraftCode)
                : null,
              matchup.awayDraftCode && !awayDQ
                ? fetchDraftEntry(matchup.draftId, matchup.awayDraftCode)
                : null,
            ]);

            if (homeDraft) {
              scored.homeTotal = homeDraft.totalScore;
              scored.homeScore = homeDraft.totalScore;
              scored.homeDraftFetched = true;
            } else if (homeDQ) {
              scored.homeTotal = 0;
              scored.homeScore = 0;
            }

            if (awayDraft) {
              scored.awayTotal = awayDraft.totalScore;
              scored.awayScore = awayDraft.totalScore;
              scored.awayDraftFetched = true;
            } else if (awayDQ) {
              scored.awayTotal = 0;
              scored.awayScore = 0;
            }

            // Determine winner only if both sides have scores
            if (
              scored.homeTotal !== undefined &&
              scored.awayTotal !== undefined
            ) {
              scored.winner =
                scored.homeTotal > scored.awayTotal
                  ? "home"
                  : scored.awayTotal > scored.homeTotal
                    ? "away"
                    : "tie";
            }
          } catch (err) {
            console.error(
              `Failed to fetch draft for ${matchup.away} vs ${matchup.home}:`,
              err,
            );
          }
        }

        return scored;
      },
    );

    const resolvedMatchups = await Promise.all(matchupPromises);

    // Accumulate new standings from API-scored matchups only
    if (!isPreseason) {
      for (const m of resolvedMatchups) {
        // Only count matchups that were scored via the API or had forfeit/DQ
        const wasAPIScored = m.homeDraftFetched || m.awayDraftFetched || m.forfeit || m.dq;
        if (!wasAPIScored) continue;
        if (m.homeTotal === undefined && m.awayTotal === undefined && !m.forfeit) continue;

        // Initialize if needed
        if (!newWins[m.home])
          newWins[m.home] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
        if (!newWins[m.away])
          newWins[m.away] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };

        // Points
        if (m.homeTotal !== undefined) {
          newWins[m.home].pointsFor += m.homeTotal;
          newWins[m.away].pointsAgainst += m.homeTotal;
        }
        if (m.awayTotal !== undefined) {
          newWins[m.away].pointsFor += m.awayTotal;
          newWins[m.home].pointsAgainst += m.awayTotal;
        }

        // W/L
        if (m.winner === "home") {
          newWins[m.home].wins++;
          newWins[m.away].losses++;
        } else if (m.winner === "away") {
          newWins[m.away].wins++;
          newWins[m.home].losses++;
        }
      }
    }

    const hasAnyScores = resolvedMatchups.some(
      (m) => m.homeTotal !== undefined && m.awayTotal !== undefined,
    );

    scoredSchedule.push({
      ...game,
      matchups: resolvedMatchups,
      played: hasAnyScores || game.played,
    });
  }

  return { scoredSchedule, newWins };
}

/**
 * Merges the baseline standings (from Google Sheet) with newly computed
 * wins/losses from API-scored games. Sheet standings = Games 1-6 baseline.
 * New computed results are ADDED on top.
 */
export function mergeStandings(
  teams: Team[],
  newWins: ComputedStandings,
): Team[] {
  return teams.map((team) => {
    const nw = newWins[team.name];
    if (!nw || (nw.wins === 0 && nw.losses === 0)) {
      // No new computed data -- keep sheet standings as-is
      return team;
    }
    return {
      ...team,
      // Add new results on top of the baseline from the sheet
      wins: team.wins + nw.wins,
      losses: team.losses + nw.losses,
    };
  });
}
