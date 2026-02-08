import { SeasonSelector } from "@/components/season-selector";
import { seasons } from "@/lib/seasons-config";

export default function Page() {
  return <SeasonSelector seasons={seasons} />;
}
