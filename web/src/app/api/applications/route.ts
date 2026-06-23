import { NextRequest, NextResponse } from "next/server";
import type { ApplicationStatus, RejectionReason, UserApplication, UserOverride } from "@/lib/types";
import { bulkUpsertApplications, getAllApplications, upsertApplication } from "@/lib/user-db";

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get("country") ?? undefined;
    const apps = await getAllApplications(country);
    return NextResponse.json({ applications: apps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const apps: UserApplication[] | undefined = body.applications;
    if (apps && Array.isArray(apps)) {
      const count = await bulkUpsertApplications(apps);
      return NextResponse.json({ migrated: count });
    }

    const intakeKey = body.intake_key as string | undefined;
    if (!intakeKey) {
      return NextResponse.json({ error: "intake_key is required" }, { status: 400 });
    }

    const app: UserApplication = {
      intake_key: intakeKey,
      status: (body.status as ApplicationStatus) ?? "todo",
      rejection_reason: body.rejection_reason as RejectionReason | undefined,
      rejection_document: body.rejection_document as string | undefined,
      rejection_note: body.rejection_note as string | undefined,
      notes: body.notes as string | undefined,
      overrides: body.overrides as UserOverride | undefined,
    };

    const saved = await upsertApplication(app);
    return NextResponse.json({ application: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
