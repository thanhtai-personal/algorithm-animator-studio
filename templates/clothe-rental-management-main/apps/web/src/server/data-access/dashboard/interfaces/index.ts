export interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface BranchRow {
  id: string;
  timezone: string | null;
  currency_code: string | null;
}

export interface PaymentAmountRow {
  order_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
  reason: string | null;
  source: string | null;
  is_initial_capital?: boolean | null;
}

export interface PaymentAmountLegacyRow {
  order_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
}

export interface PaymentCapitalImportRow {
  type: string;
  amount: number | string | null;
  is_initial_capital?: boolean | null;
  is_import_order?: boolean | null;
}

export interface DebtPaymentLegacyRow {
  order_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
}

export interface RevenueOrderRow {
  id: string;
  order_type: string | null;
  total_amount: number | string | null;
}

export interface RevenueOrderItemCogsRow {
  order_id: string;
  cogs_snapshot_amount: number | string | null;
}

export interface SalesProfitOrderRow {
  id: string;
}

export interface SalesProfitOrderItemRow {
  rent_price: number | string | null;
  cogs_snapshot_amount: number | string | null;
}

export interface DebtOrderRow {
  id: string;
  total_amount: number | string | null;
  status: string;
}

export interface DebtPaymentRow {
  order_id: string;
  type: string;
  status: string;
  amount: number | string | null;
  reason: string | null;
  source: string | null;
}

export interface DashboardOrderRow {
  id: string;
  order_code: string;
  customer_id: string;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
}

export interface CustomerRefRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface AuditEventRow {
  id: string;
  actor_profile_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
}

export interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}