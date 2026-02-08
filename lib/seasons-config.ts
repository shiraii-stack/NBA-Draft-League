// ============================================================
// SEASONS CONFIG
// Add new seasons here. Set locked: false when the season begins.
// Each season has its own Google Sheet with Standings, Schedule, Rosters tabs.
// Update the gids below to match your spreadsheet tab IDs.
// ============================================================

export type SeasonConfig = {
  id: number;
  label: string;
  locked: boolean;
  description: string;
  /** Base published spreadsheet URL (everything before ?gid=...) */
  sheetBaseUrl: string;
  /** Google Sheets tab GIDs for each data section */
  gids: {
    standings: number;
    schedule: number;
    rosters: number;
  };
};

export const seasons: SeasonConfig[] = [
  {
    id: 1,
    label: "Season 1",
    locked: false,
    description: "The inaugural NBA Draft League season",
    // Google Sheets integration — disabled until valid GIDs are set.
    // To enable: set sheetBaseUrl to your published sheet URL and
    // update the gids below with the actual tab GID numbers from
    // the URL bar when you click each tab in Google Sheets.
    sheetBaseUrl: "",
    gids: {
      standings: 0,
      schedule: 0,
      rosters: 0,
    },
  },
  {
    id: 2,
    label: "Season 2",
    locked: true,
    description: "Coming soon",
    sheetBaseUrl: "",
    gids: { standings: 0, schedule: 0, rosters: 0 },
  },
  {
    id: 3,
    label: "Season 3",
    locked: true,
    description: "Coming soon",
    sheetBaseUrl: "",
    gids: { standings: 0, schedule: 0, rosters: 0 },
  },
];

export function getSeasonConfig(id: number): SeasonConfig | undefined {
  return seasons.find((s) => s.id === id);
}
