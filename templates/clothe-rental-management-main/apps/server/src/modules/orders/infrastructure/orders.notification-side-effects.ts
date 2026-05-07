import type { OrderStatus } from '../../shared/domain/types/domain-primitives.type';
import type { OrderPaymentDto } from '../types/orders-domain.type';

export function notifyOrderStatusChanged(_options: {
  branchId: string;
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  updatedAt: string;
  actorProfileId: string;
  reason?: string | null;
}): Promise<void> {
  void _options;
  // Notifications will be migrated in a dedicated task.
  return Promise.resolve();
}

export function notifyOrderPaymentException(_options: {
  branchId: string;
  orderCode: string | null;
  payment: OrderPaymentDto;
  actorProfileId: string;
}): Promise<void> {
  void _options;
  // Notifications will be migrated in a dedicated task.
  return Promise.resolve();
}

export async function runNotificationSideEffect(
  task: () => Promise<void>,
): Promise<void> {
  try {
    await task();
  } catch (error) {
    console.warn('notification side-effect failed', error);
  }
}
