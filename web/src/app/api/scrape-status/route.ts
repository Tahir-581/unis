import { NextResponse } from "next/server";
import { getLastScrapeRun } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lastRun = getLastScrapeRun();
    return NextResponse.json({ lastRun });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
