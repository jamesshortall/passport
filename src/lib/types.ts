// Shared domain types mirroring the Supabase schema.

export type CountryStatus = "draft" | "published";
export type AppWorks = "yes" | "no" | "partial";
export type SetupEffort = "none" | "before_you_land" | "hard_needs_local_id";
export type Severity =
  | "blocked"
  | "unreliable"
  | "works_with_caveats"
  | "works_fine";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";
export type ReportStatus = "open" | "reviewed";

export interface Country {
  id: string;
  name: string;
  slug: string;
  flag_emoji: string | null;
  region: string | null;
  status: CountryStatus;
  country_alert: string | null;
  country_alert_detail: string | null;
  last_updated: string;
  created_at: string;
}

export interface AppCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface CountryApp {
  id: string;
  country_id: string;
  category_id: string;
  us_app_id: string | null;
  us_app_name: string;
  us_app_works: AppWorks;
  local_alternative_name: string | null;
  why_short: string;
  setup_effort: SetupEffort;
  detail_paragraph: string | null;
  severity: Severity;
  app_store_link: string | null;
  last_verified_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ChangeLogRow {
  id: string;
  country_id: string | null;
  app_id: string | null;
  change_summary: string;
  changed_at: string;
}

export interface ReportRow {
  id: string;
  country_apps_id: string | null;
  user_id: string | null;
  note: string | null;
  status: ReportStatus;
  created_at: string;
}

// A category with its populated app rows — the shape a country page renders.
export interface CategoryWithApps extends AppCategory {
  apps: CountryApp[];
}
