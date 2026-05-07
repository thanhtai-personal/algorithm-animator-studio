import type {
  ItemStatus,
  OrderType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from './types/domain-primitives.type';

export const ITEM_STATUS_VALUES = [
  'READY',
  'RESERVED',
  'ON_RENT',
  'LAUNDRY',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
  'SOLD',
  'RETIRED',
] as const satisfies readonly ItemStatus[];

export const ORDER_STATUS_VALUES = [
  'DRAFT',
  'RESERVED',
  'CONFIRMED',
  'PICKED_UP',
  'RETURNED',
  'DEBT',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

export const ORDER_TYPE_VALUES = [
  'RENTAL',
  'SALE',
] as const satisfies readonly OrderType[];

export const PAYMENT_STATUS_VALUES = [
  'PENDING',
  'POSTED',
  'VOIDED',
] as const satisfies readonly PaymentStatus[];

export const PAYMENT_TYPE_VALUES = [
  'RENT',
  'DEPOSIT',
  'FEE',
  'DEPOSIT_REFUND',
  'RENT_REFUND',
] as const satisfies readonly PaymentType[];

export const PAYMENT_METHOD_VALUES = [
  'CASH',
  'BANK_TRANSFER',
  'MOMO',
  'CARD',
  'OTHER',
] as const satisfies readonly PaymentMethod[];

export const ITEM_STATUS_LABEL_KEYS: Record<ItemStatus, string> = {
  READY: 'itemStatus.ready',
  RESERVED: 'itemStatus.reserved',
  ON_RENT: 'itemStatus.onRent',
  LAUNDRY: 'itemStatus.laundry',
  MAINTENANCE: 'itemStatus.maintenance',
  DAMAGED: 'itemStatus.damaged',
  LOST: 'itemStatus.lost',
  SOLD: 'itemStatus.sold',
  RETIRED: 'itemStatus.retired',
};

export const ITEM_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  READY: ['RESERVED', 'LAUNDRY', 'MAINTENANCE', 'SOLD', 'RETIRED'],
  RESERVED: ['READY', 'ON_RENT', 'LAUNDRY', 'MAINTENANCE', 'RETIRED'],
  ON_RENT: ['READY', 'LAUNDRY', 'MAINTENANCE', 'DAMAGED', 'LOST'],
  LAUNDRY: ['READY', 'MAINTENANCE', 'SOLD', 'RETIRED'],
  MAINTENANCE: ['READY', 'LAUNDRY', 'SOLD', 'RETIRED'],
  DAMAGED: ['MAINTENANCE', 'SOLD', 'RETIRED'],
  LOST: ['RETIRED'],
  SOLD: [],
  RETIRED: ['SOLD'],
};

export const MANAGER_ONLY_ITEM_TARGET_STATUSES: ItemStatus[] = [
  'DAMAGED',
  'LOST',
  'SOLD',
  'RETIRED',
];

export const ORDER_STATUS_LABEL_KEYS: Record<OrderStatus, string> = {
  DRAFT: 'orderStatus.draft',
  RESERVED: 'orderStatus.reserved',
  CONFIRMED: 'orderStatus.confirmed',
  PICKED_UP: 'orderStatus.pickedUp',
  RETURNED: 'orderStatus.returned',
  DEBT: 'orderStatus.debt',
  COMPLETED: 'orderStatus.completed',
  CANCELLED: 'orderStatus.cancelled',
};

export const ORDER_TYPE_LABEL_KEYS: Record<OrderType, string> = {
  RENTAL: 'orderType.rental',
  SALE: 'orderType.sale',
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['RESERVED', 'CONFIRMED', 'CANCELLED'],
  RESERVED: ['DRAFT', 'CONFIRMED', 'PICKED_UP', 'CANCELLED'],
  CONFIRMED: ['RESERVED', 'PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['RETURNED'],
  RETURNED: ['COMPLETED', 'DEBT'],
  DEBT: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const PAYMENT_STATUS_LABEL_KEYS: Record<PaymentStatus, string> = {
  PENDING: 'paymentStatus.pending',
  POSTED: 'paymentStatus.posted',
  VOIDED: 'paymentStatus.voided',
};

export const PAYMENT_TYPE_LABEL_KEYS: Record<PaymentType, string> = {
  RENT: 'paymentType.rent',
  DEPOSIT: 'paymentType.deposit',
  FEE: 'paymentType.fee',
  DEPOSIT_REFUND: 'paymentType.depositRefund',
  RENT_REFUND: 'paymentType.rentRefund',
};

export const PAYMENT_METHOD_LABEL_KEYS: Record<PaymentMethod, string> = {
  CASH: 'paymentMethod.cash',
  BANK_TRANSFER: 'paymentMethod.bankTransfer',
  MOMO: 'paymentMethod.momo',
  CARD: 'paymentMethod.card',
  OTHER: 'paymentMethod.other',
};
