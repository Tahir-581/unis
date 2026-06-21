import { NextResponse } from "next/server";
import { getAllPrograms, getCountryStats } from "@/lib/db";
import type { Country } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") as Country | null;

  try {
    const programs = getAllPrograms(country ?? undefined);
    const stats = getCountryStats();
    return NextResponse.json({ programs, stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load programs", detail: String(error) },
      { status: 500 }
    );
  }
}
