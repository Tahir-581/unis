export type Country = "germany" | "italy" | "spain" | "belgium" | "portugal";

export type ApplicationStatus = "todo" | "in_progress" | "submitted" | "done" | "rejected";

export type RejectionReason = "application_fees" | "deadline_passed" | "document" | "other";

export interface ProgramRow {
  intake_id: number;
  program_id: number;
  university_name: string;
  city: string | null;
  country: Country;
  program_name: string;
  external_id: string | null;
  field_domain: string | null;
  study_category: string | null;
  cs_category: string | null;
  source_url: string | null;
  intake_season: "winter" | "summer";
  intake_year: number;
  application_open: "true" | "false" | "unknown";
  application_deadline: string | null;
  application_deadline_non_eu: string | null;
  admission_url: string | null;
  confidence: string;
  last_verified_at: string | null;
  application_fee_eur: number | null;
  application_fee_notes: string | null;
  tuition_amount: number | null;
  tuition_period: string | null;
  tuition_non_eu_amount: number | null;
  tuition_notes: string | null;
  original_display_text: string | null;
  ects: number | null;
  duration_months: number | null;
}

export interface UrgentProgram extends ProgramRow {
  days_remaining: number;
}

export interface CountryStats {
  country: Country;
  intake_count: number;
  deadlines_30_days: number;
}

export interface UserOverride {
  application_open?: "true" | "false" | "unknown";
  application_deadline_non_eu?: string;
  application_fee_eur?: number;
  tuition_amount?: number;
  notes?: string;
  status?: ApplicationStatus;
}

export interface UserApplication {
  intake_key: string;
  status: ApplicationStatus;
  rejection_reason?: RejectionReason;
  rejection_document?: string;
  rejection_note?: string;
  notes?: string;
  overrides?: UserOverride;
}

export const COUNTRIES: { id: Country; label: string; flag: string }[] = [
  { id: "germany", label: "Germany", flag: "🇩🇪" },
  { id: "italy", label: "Italy", flag: "🇮🇹" },
  { id: "spain", label: "Spain", flag: "🇪🇸" },
  { id: "belgium", label: "Belgium", flag: "🇧🇪" },
  { id: "portugal", label: "Portugal", flag: "🇵🇹" },
];
