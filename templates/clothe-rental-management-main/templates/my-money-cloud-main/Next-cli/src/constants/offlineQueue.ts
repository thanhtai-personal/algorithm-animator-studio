const PENDING_PREFIX = "app.offline.pending";

export const getPendingKey = (userId: string) => `${PENDING_PREFIX}.${userId}`;
