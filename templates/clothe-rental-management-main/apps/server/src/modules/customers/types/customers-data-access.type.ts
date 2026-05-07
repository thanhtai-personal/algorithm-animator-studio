import type { OrderStatus } from '../../shared/domain/types/domain-primitives.type';
import type { CustomerTagDto } from './customers-crm.type';

export type CustomersDomainErrorCode =
  | 'BRANCH_REQUIRED'
  | 'CUSTOMER_NAME_REQUIRED'
  | 'PHONE_REQUIRED'
  | 'INVALID_PHONE'
  | 'DUPLICATE_PHONE'
  | 'CUSTOMER_ACCOUNT_CREATE_FAILED';

export interface CustomersDomainErrorContext {
  existingCustomerId?: string;
  existingCustomerName?: string;
  existingCustomerPhone?: string | null;
  accountError?: string;
}

export class CustomersDomainError extends Error {
  readonly code: CustomersDomainErrorCode;
  readonly context: CustomersDomainErrorContext;

  constructor(
    code: CustomersDomainErrorCode,
    context: CustomersDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'CustomersDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface CustomerRow {
  id: string;
  branch_id: string;
  profile_id: string | null;
  customer_code: string | null;
  full_name: string;
  phone: string | null;
  phone_normalized: string | null;
  social_link: string | null;
  address: string | null;
  note: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface CustomerTagRow {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  color: string | null;
  is_system: boolean;
  warn_on_order_create: boolean;
  block_order_create: boolean;
  is_active: boolean;
}

export interface CustomerTagAssignmentRow {
  customer_id: string;
  tag_id: string;
}

export interface CustomerOrderRow {
  id: string;
  customer_id: string;
  order_code: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: number | string | null;
  deposit_amount: number | string | null;
  created_at: string;
}

export interface IncidentRow {
  customer_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
}

export interface CustomerOrderStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface CustomerSummaryInput {
  row: CustomerRow;
  tags: CustomerTagDto[];
  stats: CustomerOrderStats | null;
}

export interface TypeaheadRankedRow {
  row: CustomerRow;
  score: number;
}

export type NormalizedOrderStatus = OrderStatus;
