export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
  is_active: boolean;
}

export interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface BranchRow {
  id: string;
  timezone: string | null;
}

export interface MakeupEventRow {
  id: string;
  branch_id: string;
  event_date: string;
  session_slot: string;
  artist_profile_id: string | null;
  customer_id: string | null;
  customer_name_snapshot: string | null;
  customer_phone_snapshot: string | null;
  guest_count: number | null;
  duration_minutes: number | null;
  start_at: string | null;
  end_at: string | null;
  source_input_mode: string | null;
  source_input_text: string | null;
  package_id: string | null;
  status: string;
  note: string | null;
  price_amount: number | string | null;
  surcharge_amount: number | string | null;
  cost_amount: number | string | null;
  is_conflict_warning: boolean;
  conflict_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileNameRow {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
  default_branch_id?: string | null;
  role?: string | null;
}

export interface CustomerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  profile_id?: string | null;
}

export interface MakeupPackageRow {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number | string | null;
  cost_amount: number | string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ActorContext {
  actor: ProfileActorRow;
  role: string | null;
  branchId: string;
  timeZone: string;
}
