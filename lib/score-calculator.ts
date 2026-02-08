// ============================================================
// AUTOMATIC SCORE CALCULATOR
// For each matchup that has draft codes (HomeLink / AwayLink),
// fetches the Real Sports API to get total scores, determines
// winners, and computes standings automatically.
// ============================================================

import { fetchDraftEntry } from "@/lib/real-sports";
import type { Team, Game, Matchup } from "@/lib/league-data";

export type ScoredMatchup = Matchup & {
  homeTotal?: number;
  awayTotal?: number;
  winner?: "home" | "away" | "tie";
  homeDraftFetched?: boolean;
  awayDraftFetched?: boolean;
};

export type ScoredGame = Omit<Game, "matchups"> & {
  matchups: ScoredMatchup[];
};

export type ComputedStandings = Record<
  string,
  { wins: number; losses: number; ties: number; pointsFor: number; pointsAgainst: number }
>;

/**
 * Fetches Real Sports draft data for all matchups that have draft codes,
 * calculates total scores, and returns the scored schedule + computed standings.
 */
export async function calculateScores(
  schedule: Game[],
  teams: Team[],
): Promise<{ scoredSchedule: ScoredGame[]; standings: ComputedStandings }> {
  // Initialize standings for all teams
  const standings: ComputedStandings = {};
  for (const team of teams) {
    standings[team.name] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
  }

  // Process each game
  const scoredSchedule: ScoredGame[] = [];

  for (const game of schedule) {
    const scoredMatchups: ScoredMatchup[] = [];

    // Collect all fetch promises for this game's matchups in parallel
    const matchupPromises = game.matchups.map(async (matchup): Promise<ScoredMatchup> => {
      const scored: ScoredMatchup = { ...matchup };

      // If scores are already set (manually in the data), use those
      if (matchup.homeScore !== undefined && matchup.awayScore !== undefined) {
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
      if (matchup.draftId && (matchup.homeDraftCode || matchup.awayDraftCode)) {
        try {
          const [homeDraft, awayDraft] = await Promise.all([
            matchup.homeDraftCode
              ? fetchDraftEntry(matchup.draftId, matchup.homeDraftCode)
              : null,
            matchup.awayDraftCode
              ? fetchDraftEntry(matchup.draftId, matchup.awayDraftCode)
              : null,
          ]);

          if (homeDraft) {
            scored.homeTotal = homeDraft.totalScore;
            scored.homeScore = homeDraft.totalScore;
            scored.homeDraftFetched = true;
          }
          if (awayDraft) {
            scored.awayTotal = awayDraft.totalScore;
            scored.awayScore = awayDraft.totalScore;
            scored.awayDraftFetched = true;
          }

          // Determine winner only if both sides have scores
          if (scored.homeTotal !== undefined && scored.awayTotal !== undefined) {
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
    });

    const resolvedMatchups = await Promise.all(matchupPromises);
    scoredMatchups.push(...resolvedMatchups);

    // Update standings based on scored matchups
    for (const m of scoredMatchups) {
      // Only count toward standings if both scores exist and it's not a preseason game
      const isPreseason = game.label.toLowerCase().includes("preseason");
      if (m.homeTotal !== undefined && m.awayTotal !== undefined && !isPreseason) {
        // Points for/against
        if (standings[m.home]) {
          standings[m.home].pointsFor += m.homeTotal;
          standings[m.home].pointsAgainst += m.awayTotal;
        }
        if (standings[m.away]) {
          standings[m.away].pointsFor += m.awayTotal;
          standings[m.away].pointsAgainst += m.homeTotal;
        }

        // W/L
        if (m.winner === "home") {
          if (standings[m.home]) standings[m.home].wins++;
          if (standings[m.away]) standings[m.away].losses++;
        } else if (m.winner === "away") {
          if (standings[m.away]) standings[m.away].wins++;
          if (standings[m.home]) standings[m.home].losses++;
        } else if (m.winner === "tie") {
          if (standings[m.home]) standings[m.home].ties++;
          if (standings[m.away]) standings[m.away].ties++;
        }
      }
    }

    const hasAnyScores = scoredMatchups.some(
      (m) => m.homeTotal !== undefined && m.awayTotal !== undefined,
    );

    scoredSchedule.push({
      ...game,
      matchups: scoredMatchups,
      played: hasAnyScores || game.played,
    });
  }

  return { scoredSchedule, standings };
}

/**
 * Merges computed standings into the teams array.
 * If a team has computed games (wins+losses > 0), use computed standings.
 * Otherwise, keep the original standings from the data file / Google Sheets.
 */
export function mergeStandings(
  teams: Team[],
  computed: ComputedStandings,
): Team[] {
  return teams.map((team) => {
    const cs = computed[team.name];
    if (!cs || (cs.wins === 0 && cs.losses === 0 && cs.ties === 0)) {
      // No computed data -- keep original
      return team;
    }
    return {
      ...team,
      wins: cs.wins,
      losses: cs.losses,
    };
  });
}
