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
function parseSchedule(csv: string): Game[] {
  const rows = parseCSV(csv);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const dateIdx = header.indexOf("date");
  const gameIdIdx = header.indexOf("gameid");
  const homeIdx = header.indexOf("hometeam");
  const awayIdx = header.indexOf("awayteam");
  const homeLinkIdx = header.indexOf("homelink");
  const awayLinkIdx = header.indexOf("awaylink");
  const sportIdx = header.indexOf("sport");
  const homeScoreIdx = header.indexOf("homescore");
  const awayScoreIdx = header.indexOf("awayscore");
  const draftIdIdx = header.indexOf("draftid");

  if (dateIdx === -1 || gameIdIdx === -1 || homeIdx === -1 || awayIdx === -1) return [];

  // Group rows by GameID
  const gameMap = new Map<string, { date: string; sport: string; matchups: Matchup[] }>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const gameId = row[gameIdIdx]?.trim();
    const date = row[dateIdx]?.trim();
    const home = row[homeIdx]?.trim();
    const away = row[awayIdx]?.trim();
    const homeLink = homeLinkIdx >= 0 ? row[homeLinkIdx]?.trim() : "";
    const awayLink = awayLinkIdx >= 0 ? row[awayLinkIdx]?.trim() : "";
    const sport = sportIdx >= 0 ? row[sportIdx]?.trim() : "NBA";
    const homeScore = homeScoreIdx >= 0 ? row[homeScoreIdx]?.trim() : "";
    const awayScore = awayScoreIdx >= 0 ? row[awayScoreIdx]?.trim() : "";
    const draftIdRaw = draftIdIdx >= 0 ? row[draftIdIdx]?.trim() : "";

    if (!gameId || !home || !away) continue;

    if (!gameMap.has(gameId)) {
      gameMap.set(gameId, { date: date || "", sport: sport || "NBA", matchups: [] });
    }

    const matchup: Matchup = { away, home };

    // Parse draft ID (shared Real Sports contest ID for the game day)
    if (draftIdRaw && !Number.isNaN(Number(draftIdRaw))) {
      matchup.draftId = Number(draftIdRaw);
    }

    // HomeLink / AwayLink are Real Sports user draft codes
    if (homeLink) {
      matchup.homeDraftCode = homeLink;
    }
    if (awayLink) {
      matchup.awayDraftCode = awayLink;
    }

    if (homeScore && !Number.isNaN(Number(homeScore))) {
      matchup.homeScore = Number(homeScore);
    }
    if (awayScore && !Number.isNaN(Number(awayScore))) {
      matchup.awayScore = Number(awayScore);
    }

    gameMap.get(gameId)!.matchups.push(matchup);
  }

  const games: Game[] = [];
  let idx = 0;
  for (const [label, data] of gameMap) {
    const played = data.matchups.some(
      (m) => m.homeScore !== undefined && m.awayScore !== undefined
    );
    games.push({
      id: idx++,
      label,
      date: data.date,
      sport: data.sport,
      matchups: data.matchups,
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
