import type { SeasonConfig } from "./seasons-config";
import type { Team, Game, Matchup } from "./league-data";
import {
  teams as fallbackTeams,
  schedule as fallbackSchedule,
} from "./league-data";

// ============================================================
// Google Sheets CSV Fetcher
// Fetches published Google Sheet tabs as CSV and parses them
// into the data structures the site uses.
// ============================================================

function csvUrl(baseUrl: string, gid: number): string {
  return `${baseUrl}?gid=${gid}&single=true&output=csv`;
}

/** Simple CSV parser that handles quoted fields */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

// Team color map
const teamColors: Record<string, string> = {
  Suns: "#E56020",
  Thunder: "#007AC1",
  Warriors: "#1D428A",
  Timberwolves: "#0C2340",
  Pacers: "#002D62",
  Pistons: "#C8102E",
  "76ers": "#006BB6",
  Raptors: "#CE1141",
};

const teamAbbrevs: Record<string, string> = {
  Suns: "PHX",
  Thunder: "OKC",
  Warriors: "GSW",
  Timberwolves: "MIN",
  Pacers: "IND",
  Pistons: "DET",
  "76ers": "PHI",
  Raptors: "TOR",
};

const teamConferences: Record<string, "West" | "East"> = {
  Suns: "West",
  Thunder: "West",
  Warriors: "West",
  Timberwolves: "West",
  Pacers: "East",
  Pistons: "East",
  "76ers": "East",
  Raptors: "East",
};

// ============================================================
// STANDINGS PARSER
// Expected columns: Team, Wins, Losses
// ============================================================
function parseStandings(csv: string): Partial<Record<string, { wins: number; losses: number }>> {
  const rows = parseCSV(csv);
  if (rows.length < 2) return {};

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const teamIdx = header.indexOf("team");
  const winsIdx = header.indexOf("wins");
  const lossesIdx = header.indexOf("losses");

  if (teamIdx === -1 || winsIdx === -1 || lossesIdx === -1) return {};

  const result: Record<string, { wins: number; losses: number }> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const team = row[teamIdx]?.trim();
    const wins = Number.parseInt(row[winsIdx] ?? "0", 10);
    const losses = Number.parseInt(row[lossesIdx] ?? "0", 10);
    if (team) {
      result[team] = { wins: Number.isNaN(wins) ? 0 : wins, losses: Number.isNaN(losses) ? 0 : losses };
    }
  }
  return result;
}

// ============================================================
// SCHEDULE PARSER
// Expected columns: Date, GameID, HomeTeam, AwayTeam, HomeLink, AwayLink, Sport
// Optional columns: HomeScore, AwayScore
// ============================================================
/** Find a column index, trying multiple name variants */
function findCol(header: string[], ...variants: string[]): number {
  for (const v of variants) {
    const idx = header.indexOf(v);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Extract a Real Sports user draft code from a value that may be:
 * - A raw code like "xnrW4GxJ"
 * - A full URL like "https://web.realsports.io/games/playerratingcontest/1429/view/Y3KmAmyJ?contestType=sport"
 *   (the user ID is the part between the last /view/ and the ? or end of string)
 * - A special keyword like "FORFEIT" or "DQ"
 */
function extractDraftCode(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  // Preserve special keywords
  if (lower === "forfeit" || lower === "dq") return trimmed;
  // Full URL: extract user ID from /view/{userId}?...
  const viewMatch = trimmed.match(/\/view\/([A-Za-z0-9_-]+)/);
  if (viewMatch) return viewMatch[1];
  // Already a raw code
  return trimmed;
}

/**
 * Extract a draft ID (contest ID) from a value that may be:
 * - A raw number like "1429"
 * - A full URL like "https://web.realsports.io/games/playerratingcontest/1429/view/..."
 */
function extractDraftId(raw: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // Try as raw number first
  const num = Number(trimmed);
  if (!Number.isNaN(num) && num > 0) return num;
  // Extract from URL pattern /playerratingcontest/{id}/
  const urlMatch = trimmed.match(/playerratingcontest\/(\d+)/);
  if (urlMatch) return Number(urlMatch[1]);
  return undefined;
}

function parseSchedule(csv: string): Game[] {
  const rows = parseCSV(csv);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
  const dateIdx = findCol(header, "date");
  const gameIdIdx = findCol(header, "gameid", "game", "gameday");
  const homeIdx = findCol(header, "hometeam", "home");
  const awayIdx = findCol(header, "awayteam", "away");
  const homeLinkIdx = findCol(header, "homelink", "homedraft", "homedraftlink");
  const awayLinkIdx = findCol(header, "awaylink", "awaydraft", "awaydraftlink");
  const sportIdx = findCol(header, "sport");
  const homeScoreIdx = findCol(header, "homescore");
  const awayScoreIdx = findCol(header, "awayscore");
  const draftIdIdx = findCol(header, "draftid", "contestid", "draft_id");

  if (dateIdx === -1 || gameIdIdx === -1 || homeIdx === -1 || awayIdx === -1) return [];

  // The spreadsheet has MULTIPLE ROWS per matchup (one per player).
  // We need to group rows by GameID + HomeTeam + AwayTeam and collect
  // all the individual player draft links into arrays.
  type MatchupAccum = {
    date: string;
    sport: string;
    draftId?: number;
    homeDraftLinks: string[];   // user IDs extracted from HomeLink URLs
    awayDraftLinks: string[];   // user IDs extracted from AwayLink URLs
    homeScore?: number;
    awayScore?: number;
  };

  // gameId -> "away|home" -> accumulated data
  const gameMap = new Map<string, Map<string, MatchupAccum>>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const gameId = row[gameIdIdx]?.trim();
    const date = row[dateIdx]?.trim() || "";
    const home = row[homeIdx]?.trim();
    const away = row[awayIdx]?.trim();
    if (!gameId || !home || !away) continue;

    const rawHomeLink = homeLinkIdx >= 0 ? row[homeLinkIdx]?.trim() ?? "" : "";
    const rawAwayLink = awayLinkIdx >= 0 ? row[awayLinkIdx]?.trim() ?? "" : "";
    const homeCode = extractDraftCode(rawHomeLink);
    const awayCode = extractDraftCode(rawAwayLink);
    const sport = sportIdx >= 0 ? row[sportIdx]?.trim() || "NBA" : "NBA";
    const homeScoreRaw = homeScoreIdx >= 0 ? row[homeScoreIdx]?.trim() : "";
    const awayScoreRaw = awayScoreIdx >= 0 ? row[awayScoreIdx]?.trim() : "";
    const draftIdRaw = draftIdIdx >= 0 ? row[draftIdIdx]?.trim() : "";

    const parsedDraftId = extractDraftId(draftIdRaw)
      ?? extractDraftId(rawHomeLink)
      ?? extractDraftId(rawAwayLink);

    const matchupKey = `${away}|${home}`;

    if (!gameMap.has(gameId)) {
      gameMap.set(gameId, new Map());
    }
    const matchups = gameMap.get(gameId)!;

    if (!matchups.has(matchupKey)) {
      matchups.set(matchupKey, {
        date,
        sport,
        draftId: parsedDraftId,
        homeDraftLinks: [],
        awayDraftLinks: [],
      });
    }

    const accum = matchups.get(matchupKey)!;
    if (!accum.draftId && parsedDraftId) accum.draftId = parsedDraftId;
    if (!accum.date && date) accum.date = date;

    // Collect player draft codes (skip special keywords -- they apply to the whole matchup)
    const homeLower = homeCode.toLowerCase();
    const awayLower = awayCode.toLowerCase();

    if (homeCode && homeLower !== "forfeit" && homeLower !== "dq") {
      accum.homeDraftLinks.push(homeCode);
    } else if (homeLower === "forfeit" || homeLower === "dq") {
      // Store as a single-element array with the keyword
      if (!accum.homeDraftLinks.includes(homeCode)) {
        accum.homeDraftLinks = [homeCode];
      }
    }

    if (awayCode && awayLower !== "forfeit" && awayLower !== "dq") {
      accum.awayDraftLinks.push(awayCode);
    } else if (awayLower === "forfeit" || awayLower === "dq") {
      if (!accum.awayDraftLinks.includes(awayCode)) {
        accum.awayDraftLinks = [awayCode];
      }
    }

    // If there are explicit scores in the sheet, use the last non-empty one
    if (homeScoreRaw && !Number.isNaN(Number(homeScoreRaw))) {
      accum.homeScore = Number(homeScoreRaw);
    }
    if (awayScoreRaw && !Number.isNaN(Number(awayScoreRaw))) {
      accum.awayScore = Number(awayScoreRaw);
    }
  }

  // Build final Game[] from accumulated data
  const games: Game[] = [];
  let idx = 0;
  for (const [label, matchupMap] of gameMap) {
    const matchups: Matchup[] = [];
    let gameDate = "";
    let gameSport = "NBA";

    for (const [key, accum] of matchupMap) {
      const [away, home] = key.split("|");
      if (!gameDate && accum.date) gameDate = accum.date;
      if (accum.sport) gameSport = accum.sport;

      const matchup: Matchup = { away, home };
      if (accum.draftId) matchup.draftId = accum.draftId;
      if (accum.homeDraftLinks.length > 0) matchup.homeDraftLinks = accum.homeDraftLinks;
      if (accum.awayDraftLinks.length > 0) matchup.awayDraftLinks = accum.awayDraftLinks;
      if (accum.homeScore !== undefined) matchup.homeScore = accum.homeScore;
      if (accum.awayScore !== undefined) matchup.awayScore = accum.awayScore;

      matchups.push(matchup);
    }

    const played = matchups.some(
      (m) => m.homeScore !== undefined && m.awayScore !== undefined
    );
    games.push({
      id: idx++,
      label,
      date: gameDate,
      sport: gameSport,
      matchups,
      played,
    });
  }

  return games;
}

// ============================================================
// ROSTERS PARSER
// Expected columns: Team, GM, Player1, Player2, Player3, Player4, Player5, Player6
// ============================================================
function parseRosters(csv: string): Partial<Record<string, { gm: string; roster: string[] }>> {
  const rows = parseCSV(csv);
  if (rows.length < 2) return {};

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const teamIdx = header.indexOf("team");
  const gmIdx = header.indexOf("gm");

  if (teamIdx === -1 || gmIdx === -1) return {};

  const result: Record<string, { gm: string; roster: string[] }> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const team = row[teamIdx]?.trim();
    const gm = row[gmIdx]?.trim() || "";
    if (!team) continue;

    const roster: string[] = [];
    // All columns after GM are player columns
    for (let j = gmIdx + 1; j < row.length; j++) {
      const player = row[j]?.trim();
      if (player) roster.push(player);
    }
    result[team] = { gm, roster };
  }
  return result;
}

// ============================================================
// MAIN FETCH FUNCTION
// Returns teams + schedule for a season, merging sheets data
// with static fallback data.
// ============================================================
/** Fetch with a timeout to prevent hanging requests from crashing SSR */
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Safely fetch a CSV tab, returning empty string on any error */
async function safeFetchCSV(baseUrl: string, gid: number): Promise<string> {
  try {
    const res = await fetchWithTimeout(csvUrl(baseUrl, gid));
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

export async function fetchSeasonData(config: SeasonConfig): Promise<{
  teams: Team[];
  schedule: Game[];
}> {
  if (!config.sheetBaseUrl) {
    return { teams: fallbackTeams, schedule: fallbackSchedule };
  }

  let standingsData: ReturnType<typeof parseStandings> = {};
  let scheduleData: Game[] = [];
  let rostersData: ReturnType<typeof parseRosters> = {};

  try {
    const [standingsCSV, scheduleCSV, rostersCSV] = await Promise.all([
      safeFetchCSV(config.sheetBaseUrl, config.gids.standings),
      safeFetchCSV(config.sheetBaseUrl, config.gids.schedule),
      safeFetchCSV(config.sheetBaseUrl, config.gids.rosters),
    ]);

    if (standingsCSV) {
      standingsData = parseStandings(standingsCSV);
    }
    if (scheduleCSV) {
      const parsed = parseSchedule(scheduleCSV);
      const withDrafts = parsed.filter(g => g.matchups.some(m => m.draftId));
      console.log("[v0] Schedule: " + parsed.length + " games, " + withDrafts.length + " with drafts");
      if (withDrafts.length > 0) {
        const sampleM = withDrafts[0].matchups[0];
        console.log("[v0] Sample: " + sampleM?.away + " @ " + sampleM?.home + " draftId=" + sampleM?.draftId + " homeLinks=" + (sampleM?.homeDraftLinks?.length ?? 0) + " awayLinks=" + (sampleM?.awayDraftLinks?.length ?? 0));
      }
      if (parsed.length > 0) scheduleData = parsed;
    }
    if (rostersCSV) {
      rostersData = parseRosters(rostersCSV);
    }
  } catch (e) {
    console.error("Failed to fetch Google Sheets data, using fallback:", e);
  }

  // Merge standings + rosters into teams
  const mergedTeams: Team[] = fallbackTeams.map((t) => {
    const standing = standingsData[t.name];
    const rosterInfo = rostersData[t.name];
    return {
      ...t,
      wins: standing?.wins ?? t.wins,
      losses: standing?.losses ?? t.losses,
      gm: rosterInfo?.gm ?? t.gm,
      roster: rosterInfo?.roster && rosterInfo.roster.length > 0 ? rosterInfo.roster : t.roster,
      color: teamColors[t.name] ?? t.color,
      abbrev: teamAbbrevs[t.name] ?? t.abbrev,
      conference: teamConferences[t.name] ?? t.conference,
    };
  });

  // Use sheet schedule if available, otherwise fallback
  const mergedSchedule = scheduleData.length > 0 ? scheduleData : fallbackSchedule;

  return { teams: mergedTeams, schedule: mergedSchedule };
}
