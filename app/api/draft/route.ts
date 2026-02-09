import { NextResponse } from "next/server";
import { fetchDraftEntry } from "@/lib/real-sports";

/**
 * GET /api/draft?draftId=1442&code=xnrW4GxJ
 *
 * Server-side proxy for the Real Sports API.
 * Keeps auth headers private on the server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const draftId = searchParams.get("draftId");
  const code = searchParams.get("code");

  if (!draftId || !code) {
    return NextResponse.json(
      { error: "Missing draftId or code parameter" },
      { status: 400 },
    );
  }

  const draftIdNum = Number.parseInt(draftId, 10);
  if (Number.isNaN(draftIdNum)) {
    return NextResponse.json(
      { error: "Invalid draftId" },
      { status: 400 },
    );
  }

  const result = await fetchDraftEntry(draftIdNum, code);

  if (!result) {
    return NextResponse.json(
      { error: "Failed to fetch draft data" },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
