// ============================================================
// REAL SPORTS API INTEGRATION
// Fetches draft lineup data from the Real Sports app.
// Auth headers are stored as environment variables.
// The real-request-token is generated dynamically using Hashids.
//
// API URL pattern:
//   GET https://web.realsports.io/games/playerratingcontest/{draftId}/view/{userDraftCode}?contestType=sport
//
// Where:
//   - draftId = contest ID for an entire game day/sport (e.g. 1442)
//   - userDraftCode = unique per-person draft entry code (e.g. xnrW4GxJ)
// ============================================================

import Hashids from "hashids";

export type RealSportsPlayer = {
  order: number;
  playerId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  multiplier: number;
  multiplierDisplay: string;
  score: number;
  avatar: string;
  teamId: number;
  jersey: number;
  backgroundColor: string;
};

export type RealSportsDraft = {
  contestId: number;
  contestDay: string;
  sport: string;
  isFinalized: boolean;
  lineupSize: number;
  userName: string;
  userId: string;
  lineup: RealSportsPlayer[];
  totalScore: number;
};

/** Generate a fresh real-request-token using Hashids + current timestamp */
function generateRequestToken(): string {
  const hashids = new Hashids("realwebapp", 16);
  return hashids.encode(Date.now());
}

/**
 * Fetches a single draft entry from Real Sports.
 * Must be called server-side (API route) since it needs auth headers.
 */
export async function fetchDraftEntry(
  draftId: number,
  userDraftCode: string,
): Promise<RealSportsDraft | null> {
  const authInfo = process.env.REAL_AUTH_INFO;
  const deviceUuid = process.env.REAL_DEVICE_UUID;

  if (!authInfo || !deviceUuid) {
    console.error("Real Sports API credentials not configured");
    return null;
  }

  const requestToken = generateRequestToken();

  const url = `https://web.realsports.io/games/playerratingcontest/${draftId}/view/${userDraftCode}?contestType=sport`;

  try {
    const res = await fetch(url, {
      headers: {
        "real-auth-info": authInfo,
        "real-device-type": "desktop_web",
        "real-device-uuid": deviceUuid,
        "real-request-token": requestToken ?? "",
        "real-version": "27",
        Origin: "https://realsports.io",
        Referer: "https://realsports.io/",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.error(`Real Sports API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    const lineup: RealSportsPlayer[] = (data.lineup ?? []).map(
      // biome-ignore lint: using any for external API
      (p: any) => ({
        order: p.order,
        playerId: p.playerId ?? p.id,
        displayName: p.displayName ?? `${p.firstName} ${p.lastName}`,
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        multiplier: p.multiplier ?? 1,
        multiplierDisplay: p.multiplierDisplay ?? "1x",
        score: p.score ?? 0,
        avatar: p.avatar ?? "",
        teamId: p.teamId ?? 0,
        jersey: p.jersey ?? 0,
        backgroundColor: p.backgroundColor ?? "#333333",
      }),
    );

    const totalScore = lineup.reduce((sum, p) => sum + p.score, 0);

    return {
      contestId: data.info?.contest?.id ?? draftId,
      contestDay: data.info?.contest?.day ?? "",
      sport: data.info?.contest?.sport ?? "nba",
      isFinalized: data.info?.contest?.isFinalized ?? false,
      lineupSize: data.info?.contest?.additionalInfo?.lineupSize ?? 5,
      userName: data.info?.user?.userName ?? "",
      userId: data.info?.userId ?? "",
      lineup,
      totalScore,
    };
  } catch (error) {
    console.error("Failed to fetch Real Sports draft:", error);
    return null;
  }
}
