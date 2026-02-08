import { notFound, redirect } from "next/navigation";
import { getSeasonConfig } from "@/lib/seasons-config";
import { fetchSeasonData } from "@/lib/sheets";
import {
  draftCapital,
  teams as fallbackTeams,
  schedule as fallbackSchedule,
} from "@/lib/league-data";
import { SeasonDashboard } from "@/components/season-dashboard";

export async function generateMetadata({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seasonId = Number.parseInt(id, 10);
  const config = getSeasonConfig(seasonId);
  if (!config) return { title: "Season Not Found" };
  return {
    title: `NBA Draft League - ${config.label}`,
    description: `Standings, schedule, rosters, draft capital, and live scoring for ${config.label}.`,
  };
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seasonId = Number.parseInt(id, 10);
  const config = getSeasonConfig(seasonId);

  if (!config) notFound();
  if (config.locked) redirect("/");

  let teams = fallbackTeams;
  let schedule = fallbackSchedule;

  try {
    const data = await fetchSeasonData(config);
    teams = data.teams;
    schedule = data.schedule;
  } catch {
    // If sheets fetch fails entirely, fallback data is already set
  }

  return (
    <SeasonDashboard
      seasonId={seasonId}
      seasonLabel={config.label}
      teams={teams}
      schedule={schedule}
      draftCapital={draftCapital}
    />
  );
}
