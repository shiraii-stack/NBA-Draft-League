// ============================================================
// NBA DRAFT LEAGUE - CENTRAL DATA FILE
// Edit this file to update all league information.
// ============================================================

export type Team = {
  name: string;
  abbrev: string;
  gm: string;
  conference: "West" | "East";
  wins: number;
  losses: number;
  color: string;
  roster: string[];
};

export type Matchup = {
  away: string;
  home: string;
  awayScore?: number;
  homeScore?: number;
  // Starters for each team (up to 5)
  awayStarters?: string[];
  homeStarters?: string[];
  // Draft links from Real App (one per starter)
  awayDraftLinks?: string[];
  homeDraftLinks?: string[];
  // Individual starter scores
  awayStarterScores?: number[];
  homeStarterScores?: number[];
};

export type Game = {
  id: number;
  label: string;
  date: string;
  sport: string;
  matchups: Matchup[];
  played: boolean;
};

export type DraftPick = {
  round: string;
  origin: string;
};

export type TeamDraftCapital = {
  team: string;
  seasons: { season: string; picks: DraftPick[] }[];
};

// ============================================================
// TEAMS — Edit rosters, GMs, records here
// Each team has 5-7 players. Update after trades/signings.
// ============================================================
export const teams: Team[] = [
  // West
  { name: "Suns", abbrev: "PHX", gm: "@dbook", conference: "West", wins: 4, losses: 1, color: "#E56020", roster: ["@jaxon", "@calebownsgb", "@victorosimhen", "@levandro", "@eaglesyanks", "@jdclapz17"] },
  { name: "Thunder", abbrev: "OKC", gm: "@frager", conference: "West", wins: 1, losses: 4, color: "#007AC1", roster: ["@et_phi", "@usa", "@j.b", "@jerzydrozdo21", "@osboti", "@mmf"] },
  { name: "Warriors", abbrev: "GSW", gm: "@ap", conference: "West", wins: 2, losses: 3, color: "#1D428A", roster: ["@tank", "@chipotlemexicangrill", "@jamski382", "@bignysportsfan", "@jakemccarthy"] },
  { name: "Timberwolves", abbrev: "MIN", gm: "@davison_0", conference: "West", wins: 2, losses: 3, color: "#0C2340", roster: ["@hankthetank4", "@elitrem", "@jakobe.walter", "@tage", "@burenjr"] },
  // East
  { name: "Pacers", abbrev: "IND", gm: "@superduck", conference: "East", wins: 4, losses: 1, color: "#002D62", roster: ["@imaginewinning", "@tadabrot", "@tj7_ynwa", "@timotimee", "@warren", "@keno1467"] },
  { name: "Pistons", abbrev: "DET", gm: "@lotto12", conference: "East", wins: 2, losses: 3, color: "#C8102E", roster: ["@lecunningham", "@duolingo", "@wtephwurry", "@knicks_fan1"] },
  { name: "76ers", abbrev: "PHI", gm: "@shiraii", conference: "East", wins: 4, losses: 1, color: "#006BB6", roster: ["@lukatop2oat", "@bill", "@hayes23", "@drab101", "@iluvunderwood", "@togyk04"] },
  { name: "Raptors", abbrev: "TOR", gm: "@konnorgriffin.1", conference: "East", wins: 1, losses: 4, color: "#CE1141", roster: ["@windycitysportsfan", "@griff168", "@marvinalcantara_", "@ronin_", "@ok124", "@calebwilliams18"] },
];

// ============================================================
// SCHEDULE — Add/edit games here. Set played: true and add scores after each game day
// ============================================================
export const schedule: Game[] = [
  {
    id: 0,
    label: "Preseason Game 1",
    date: "1/26",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Pistons", home: "Suns" },
      { away: "Timberwolves", home: "Raptors" },
      { away: "Thunder", home: "Pacers" },
      { away: "Warriors", home: "76ers" },
    ],
  },
  {
    id: 1,
    label: "Game 1",
    date: "1/28",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Timberwolves", home: "Pistons" },
      { away: "Warriors", home: "Thunder" },
      { away: "Suns", home: "76ers" },
      { away: "Pacers", home: "Raptors" },
    ],
  },
  {
    id: 2,
    label: "Game 2",
    date: "1/30",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Raptors", home: "Warriors" },
      { away: "Suns", home: "Timberwolves" },
      { away: "Pacers", home: "Thunder" },
      { away: "Pistons", home: "76ers" },
    ],
  },
  {
    id: 3,
    label: "Game 3",
    date: "2/1",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Timberwolves", home: "76ers" },
      { away: "Pacers", home: "Warriors" },
      { away: "Raptors", home: "Thunder" },
      { away: "Pistons", home: "Suns" },
    ],
  },
  {
    id: 4,
    label: "Game 4",
    date: "2/3",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Warriors", home: "76ers" },
      { away: "Pistons", home: "Raptors" },
      { away: "Thunder", home: "Timberwolves" },
      { away: "Pacers", home: "Suns" },
    ],
  },
  {
    id: 5,
    label: "Game 5",
    date: "2/5",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "76ers", home: "Pacers" },
      { away: "Timberwolves", home: "Warriors" },
      { away: "Raptors", home: "Pistons" },
      { away: "Suns", home: "Thunder" },
    ],
  },
  {
    id: 6,
    label: "Game 6",
    date: "2/7",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Suns", home: "Raptors" },
      { away: "76ers", home: "Thunder" },
      { away: "Timberwolves", home: "Pacers" },
      { away: "Warriors", home: "Pistons" },
    ],
  },
  {
    id: 7,
    label: "Game 7",
    date: "2/8",
    sport: "NFL",
    played: false,
    matchups: [
      { away: "Suns", home: "Warriors" },
      { away: "Pacers", home: "Pistons" },
      { away: "Timberwolves", home: "Raptors" },
      { away: "76ers", home: "Thunder" },
    ],
  },
  {
    id: 8,
    label: "Game 8",
    date: "2/11",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Raptors", home: "Warriors" },
      { away: "Suns", home: "Timberwolves" },
      { away: "Pacers", home: "Thunder" },
      { away: "Pistons", home: "76ers" },
    ],
  },
  {
    id: 9,
    label: "Game 9",
    date: "2/13",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Suns", home: "Raptors" },
      { away: "76ers", home: "Thunder" },
      { away: "Timberwolves", home: "Pacers" },
      { away: "Warriors", home: "Pistons" },
    ],
  },
  {
    id: 10,
    label: "Game 10",
    date: "2/15",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Timberwolves", home: "Pistons" },
      { away: "Warriors", home: "Thunder" },
      { away: "Suns", home: "76ers" },
      { away: "Pacers", home: "Raptors" },
    ],
  },
  {
    id: 11,
    label: "Game 11",
    date: "2/17",
    sport: "CBB",
    played: false,
    matchups: [
      { away: "Suns", home: "Warriors" },
      { away: "Pacers", home: "Pistons" },
      { away: "Timberwolves", home: "Raptors" },
      { away: "76ers", home: "Thunder" },
    ],
  },
  {
    id: 12,
    label: "Game 12",
    date: "2/19",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Raptors", home: "Pacers" },
      { away: "Timberwolves", home: "Warriors" },
      { away: "Pistons", home: "Thunder" },
      { away: "76ers", home: "Suns" },
    ],
  },
  {
    id: 13,
    label: "Game 13",
    date: "2/21",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Timberwolves", home: "76ers" },
      { away: "Pacers", home: "Warriors" },
      { away: "Raptors", home: "Thunder" },
      { away: "Pistons", home: "Suns" },
    ],
  },
  {
    id: 14,
    label: "Game 14",
    date: "2/23",
    sport: "NBA",
    played: false,
    matchups: [
      { away: "Warriors", home: "76ers" },
      { away: "Pistons", home: "Raptors" },
      { away: "Thunder", home: "Timberwolves" },
      { away: "Pacers", home: "Suns" },
    ],
  },
];

// ============================================================
// DRAFT CAPITAL — Edit picks, trades, origins here
// ============================================================
export const draftCapital: TeamDraftCapital[] = [
  {
    team: "Suns",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Suns" },
          { round: "2nd", origin: "Suns" },
          { round: "2nd", origin: "Warriors" },
          { round: "3rd", origin: "Suns" },
          { round: "3rd", origin: "Warriors" },
          { round: "4th", origin: "Suns" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Suns" },
          { round: "2nd", origin: "Suns" },
          { round: "3rd", origin: "Suns" },
          { round: "4th", origin: "Suns" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Suns" },
          { round: "2nd", origin: "Suns" },
          { round: "3rd", origin: "Suns" },
          { round: "4th", origin: "Suns" },
          { round: "5th", origin: "Suns" },
        ],
      },
    ],
  },
  {
    team: "Thunder",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Thunder" },
          { round: "2nd", origin: "Thunder" },
          { round: "3rd", origin: "Thunder" },
          { round: "4th", origin: "Thunder" },
          { round: "5th", origin: "Suns" },
          { round: "5th", origin: "Thunder" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Thunder" },
          { round: "2nd", origin: "Thunder" },
          { round: "3rd", origin: "Thunder" },
          { round: "4th", origin: "Thunder" },
          { round: "5th", origin: "Suns" },
          { round: "5th", origin: "Thunder" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Thunder" },
          { round: "2nd", origin: "Thunder" },
          { round: "3rd", origin: "Thunder" },
          { round: "4th", origin: "Thunder" },
          { round: "5th", origin: "Thunder" },
        ],
      },
    ],
  },
  {
    team: "Timberwolves",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "3rd", origin: "Timberwolves" },
          { round: "4th", origin: "Timberwolves" },
          { round: "5th", origin: "Timberwolves" },
          { round: "5th", origin: "Raptors" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "2nd", origin: "Timberwolves" },
          { round: "4th", origin: "Timberwolves" },
          { round: "5th", origin: "Timberwolves" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Timberwolves" },
          { round: "2nd", origin: "Timberwolves" },
          { round: "3rd", origin: "Timberwolves" },
          { round: "4th", origin: "Timberwolves" },
          { round: "5th", origin: "Timberwolves" },
        ],
      },
    ],
  },
  {
    team: "Warriors",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Warriors" },
          { round: "1st", origin: "Timberwolves" },
          { round: "4th", origin: "Warriors" },
          { round: "5th", origin: "Warriors" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Warriors" },
          { round: "1st", origin: "Timberwolves" },
          { round: "2nd", origin: "Warriors" },
          { round: "3rd", origin: "Warriors" },
          { round: "4th", origin: "Warriors" },
          { round: "5th", origin: "Warriors" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Warriors" },
          { round: "2nd", origin: "Warriors" },
          { round: "3rd", origin: "Warriors" },
          { round: "4th", origin: "Warriors" },
          { round: "5th", origin: "Warriors" },
        ],
      },
    ],
  },
  {
    team: "Raptors",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Raptors" },
          { round: "2nd", origin: "Timberwolves" },
          { round: "2nd", origin: "Raptors" },
          { round: "3rd", origin: "Raptors" },
          { round: "4th", origin: "Raptors" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Raptors" },
          { round: "2nd", origin: "Raptors" },
          { round: "3rd", origin: "Timberwolves" },
          { round: "3rd", origin: "Raptors" },
          { round: "4th", origin: "Raptors" },
          { round: "5th", origin: "Raptors" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Raptors" },
          { round: "2nd", origin: "Raptors" },
          { round: "3rd", origin: "Raptors" },
          { round: "4th", origin: "Raptors" },
          { round: "5th", origin: "Raptors" },
        ],
      },
    ],
  },
  {
    team: "76ers",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "76ers" },
          { round: "2nd", origin: "76ers" },
          { round: "3rd", origin: "76ers" },
          { round: "4th", origin: "76ers" },
          { round: "5th", origin: "76ers" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "76ers" },
          { round: "2nd", origin: "76ers" },
          { round: "3rd", origin: "76ers" },
          { round: "4th", origin: "76ers" },
          { round: "5th", origin: "76ers" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "76ers" },
          { round: "2nd", origin: "76ers" },
          { round: "3rd", origin: "76ers" },
          { round: "4th", origin: "76ers" },
          { round: "5th", origin: "76ers" },
        ],
      },
    ],
  },
  {
    team: "Pistons",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Pistons" },
          { round: "2nd", origin: "Pistons" },
          { round: "3rd", origin: "Pistons" },
          { round: "4th", origin: "Pistons" },
          { round: "5th", origin: "Pistons" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Pistons" },
          { round: "2nd", origin: "Pistons" },
          { round: "3rd", origin: "Pistons" },
          { round: "4th", origin: "Pistons" },
          { round: "5th", origin: "Pistons" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Pistons" },
          { round: "2nd", origin: "Pistons" },
          { round: "3rd", origin: "Pistons" },
          { round: "4th", origin: "Pistons" },
          { round: "5th", origin: "Pistons" },
        ],
      },
    ],
  },
  {
    team: "Pacers",
    seasons: [
      {
        season: "S2",
        picks: [
          { round: "1st", origin: "Pacers" },
          { round: "2nd", origin: "Pacers" },
          { round: "3rd", origin: "Pacers" },
          { round: "4th", origin: "Pacers" },
          { round: "5th", origin: "Pacers" },
        ],
      },
      {
        season: "S3",
        picks: [
          { round: "1st", origin: "Pacers" },
          { round: "2nd", origin: "Pacers" },
          { round: "3rd", origin: "Pacers" },
          { round: "4th", origin: "Pacers" },
          { round: "5th", origin: "Pacers" },
        ],
      },
      {
        season: "S4",
        picks: [
          { round: "1st", origin: "Pacers" },
          { round: "2nd", origin: "Pacers" },
          { round: "3rd", origin: "Pacers" },
          { round: "4th", origin: "Pacers" },
          { round: "5th", origin: "Pacers" },
        ],
      },
    ],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getTeamsByConference(conference: "West" | "East") {
  return teams.filter((t) => t.conference === conference);
}

export function getStandings(conference?: "West" | "East") {
  const filtered = conference
    ? teams.filter((t) => t.conference === conference)
    : teams;
  return [...filtered].sort((a, b) => {
    const winPctA =
      a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const winPctB =
      b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    if (winPctB !== winPctA) return winPctB - winPctA;
    return b.wins - a.wins;
  });
}

export function getDraftOrder() {
  // Worst record gets #1 pick
  return [...teams].sort((a, b) => {
    const winPctA =
      a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0.5;
    const winPctB =
      b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0.5;
    if (winPctA !== winPctB) return winPctA - winPctB;
    return a.wins - b.wins;
  });
}

export function getTeamColor(teamName: string): string {
  return teams.find((t) => t.name === teamName)?.color ?? "#888888";
}

export function getTeam(name: string) {
  return teams.find((t) => t.name === name);
}

export function getTeamDraftCapital(teamName: string) {
  return draftCapital.find((d) => d.team === teamName);
}

export function getSportBadgeClass(sport: string): string {
  switch (sport) {
    case "NBA":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "NFL":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "CBB":
      return "bg-sky-500/20 text-sky-400 border-sky-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Get all player scores across all completed game days
export function getAllPlayerScores() {
  const scores: {
    player: string;
    team: string;
    gameDay: string;
    score: number;
  }[] = [];
  for (const game of schedule) {
    if (!game.played) continue;
    for (const m of game.matchups) {
      if (m.awayStarters && m.awayStarterScores) {
        m.awayStarters.forEach((player, i) => {
          scores.push({
            player,
            team: m.away,
            gameDay: game.label,
            score: m.awayStarterScores![i] ?? 0,
          });
        });
      }
      if (m.homeStarters && m.homeStarterScores) {
        m.homeStarters.forEach((player, i) => {
          scores.push({
            player,
            team: m.home,
            gameDay: game.label,
            score: m.homeStarterScores![i] ?? 0,
          });
        });
      }
    }
  }
  return scores;
}

// Leaderboard for a specific game day
export function getGameDayLeaderboard(gameDayLabel: string) {
  const scores = getAllPlayerScores().filter(
    (s) => s.gameDay === gameDayLabel
  );
  scores.sort((a, b) => b.score - a.score);
  return scores.map((s, i) => ({ ...s, position: i + 1 }));
}

// Calculate average score and ADP (Average Draft Position) across all game days
export function getPlayerADP() {
  const allScores = getAllPlayerScores();
  const gameDays = [...new Set(allScores.map((s) => s.gameDay))];

  // Assign positions per game day
  const withPositions: (typeof allScores[number] & { position: number })[] =
    [];
  for (const gd of gameDays) {
    const dayScores = allScores
      .filter((s) => s.gameDay === gd)
      .sort((a, b) => b.score - a.score);
    dayScores.forEach((s, i) => {
      withPositions.push({ ...s, position: i + 1 });
    });
  }

  // Group by player
  const playerMap = new Map<
    string,
    { team: string; scores: number[]; positions: number[] }
  >();
  for (const s of withPositions) {
    if (!playerMap.has(s.player)) {
      playerMap.set(s.player, { team: s.team, scores: [], positions: [] });
    }
    const entry = playerMap.get(s.player)!;
    entry.scores.push(s.score);
    entry.positions.push(s.position);
  }

  const results = Array.from(playerMap.entries()).map(([player, data]) => ({
    player,
    team: data.team,
    gamesPlayed: data.scores.length,
    avgScore:
      data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    adp:
      data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
  }));

  results.sort((a, b) => a.adp - b.adp);
  return results;
}
