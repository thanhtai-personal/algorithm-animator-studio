import type { OrderStatus } from '../../shared/domain/types/domain-primitives.type';
import { ORDER_STATUS_VALUES } from '../../shared/domain/domain-primitives.constants';

export const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS_VALUES);
export const SPENT_STATUS_SET = new Set<OrderStatus>([
  'RESERVED',
  'CONFIRMED',
  'PICKED_UP',
  'RETURNED',
  'DEBT',
  'COMPLETED',
]);
