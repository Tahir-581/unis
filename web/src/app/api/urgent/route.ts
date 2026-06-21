import { NextResponse } from "next/server";
import { getUrgentPrograms } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const urgent = getUrgentPrograms(5);
    return NextResponse.json({ urgent });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load urgent deadlines", detail: String(error) },
      { status: 500 }
    );
  }
}
