import type { PaymentListItemDto } from '../types/payments-domain.type';

export function notifyPaymentException(_options: {
  item: PaymentListItemDto;
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
