import { notFound, redirect } from "next/navigation";
import { getSeasonConfig } from "@/lib/seasons-config";
import { fetchSeasonData } from "@/lib/sheets";
import { draftCapital } from "@/lib/league-data";
import { SeasonDashboard } from "@/components/season-dashboard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
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

  const { teams, schedule } = await fetchSeasonData(config);

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
