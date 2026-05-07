import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/server/data-access/auth";
import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItemDto,
  NotificationPayloadDto,
  NotificationSeverity,
  NotificationsListQuery,
  NotificationsListResponse,
} from "@/types/notificationsModule";
import type { ShowroomRole } from "@/types/showroomAuth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const NOTIFICATION_SEVERITY_SET = new Set<NotificationSeverity>([
  "info",
  "success",
  "warning",
  "error",
]);

const NOTIFICATION_ROW_SELECT =
  "id, recipient_profile_id, branch_id, type, severity, title, body, payload_json, event_key, is_read, read_at, created_by, created_at, updated_at";

type NotificationsDomainErrorCode =
  | "INVALID_NOTIFICATION_CURSOR"
  | "INVALID_NOTIFICATION_LIMIT"
  | "NOTIFICATION_NOT_FOUND"
  | "NOTIFICATION_INSERT_FAILED"
  | "NOTIFICATION_RECIPIENTS_NOT_FOUND"
  | "MISSING_PROFILE_CONTEXT";

interface NotificationsDomainErrorContext {
  [key: string]: unknown;
}

export class NotificationsDomainError extends Error {
  readonly code: NotificationsDomainErrorCode;
  readonly context: NotificationsDomainErrorContext;

  constructor(code: NotificationsDomainErrorCode, context: NotificationsDomainErrorContext = {}) {
    super(code);
    this.name = "NotificationsDomainError";
    this.code = code;
    this.context = context;
  }
}

interface NotificationRow {
  id: string;
  recipient_profile_id: string;
  branch_id: string | null;
  type: string;
  severity: string;
  title: string;
  body: string;
  payload_json: NotificationPayloadDto | null;
  event_key: string | null;
  is_read: boolean;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileExistsRow {
  id: string;
}

interface BranchRecipientRow {
  profile_id: string;
}

interface RecipientProfileRow {
  id: string;
  role: ShowroomRole | null;
  is_active: boolean;
}

export interface NotificationInsertInput {
  recipientProfileId: string;
  branchId?: string | null;
  type: string;
  severity?: NotificationSeverity;
  title: string;
  body: string;
  payload?: NotificationPayloadDto;
  eventKey?: string | null;
  createdBy?: string | null;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSeverity(value: string | null | undefined): NotificationSeverity {
  if (!value) return "info";
  const normalized = value.trim().toLowerCase() as NotificationSeverity;
  if (!NOTIFICATION_SEVERITY_SET.has(normalized)) {
    return "info";
  }
  return normalized;
}

function normalizeLimit(value: number | null | undefined): number {
  if (value === null || value === undefined) return DEFAULT_LIMIT;
  if (!Number.isFinite(value)) {
    throw new NotificationsDomainError("INVALID_NOTIFICATION_LIMIT", {
      value,
    });
  }

  const normalized = Math.floor(value);
  if (normalized <= 0) {
    throw new NotificationsDomainError("INVALID_NOTIFICATION_LIMIT", {
      value,
    });
  }

  return Math.min(MAX_LIMIT, normalized);
}

function parseCursor(cursor: string | null | undefined): string | null {
  const value = sanitizeText(cursor);
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new NotificationsDomainError("INVALID_NOTIFICATION_CURSOR", {
      cursor,
    });
  }

  return date.toISOString();
}

function mapNotificationRow(row: NotificationRow): NotificationItemDto {
  return {
    id: row.id,
    recipientProfileId: row.recipient_profile_id,
    branchId: row.branch_id,
    type: row.type,
    severity: normalizeSeverity(row.severity),
    title: row.title,
    body: row.body,
    payload: (row.payload_json ?? {}) as NotificationPayloadDto,
    eventKey: row.event_key,
    isRead: row.is_read,
    readAt: row.read_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureProfileExists(supabase: SupabaseClient, profileId: string): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("is_active", true)
    .maybeSingle<ProfileExistsRow>();

  if (error) throw error;
  if (!data) {
    throw new NotificationsDomainError("MISSING_PROFILE_CONTEXT", {
      profileId,
    });
  }
}

async function fetchUnreadCount(supabase: SupabaseClient, recipientProfileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_profile_id", recipientProfileId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function listNotificationsForProfile(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: NotificationsListQuery;
  }
): Promise<NotificationsListResponse> {
  await ensureProfileExists(supabase, options.actorProfileId);

  const limit = normalizeLimit(options.query.limit);
  const cursorIso = parseCursor(options.query.cursor);

  let query = supabase
    .from("notifications")
    .select(NOTIFICATION_ROW_SELECT)
    .eq("recipient_profile_id", options.actorProfileId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (options.query.isRead !== null && options.query.isRead !== undefined) {
    query = query.eq("is_read", options.query.isRead);
  }

  if (cursorIso) {
    query = query.lt("created_at", cursorIso);
  }

  const [{ data, error }, unreadCount] = await Promise.all([
    query.returns<NotificationRow[]>(),
    fetchUnreadCount(supabase, options.actorProfileId),
  ]);

  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: pageRows.map(mapNotificationRow),
    unreadCount,
    nextCursor: hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null,
  };
}

export async function markNotificationReadForProfile(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    notificationId: string;
  }
): Promise<MarkNotificationReadResponse> {
  await ensureProfileExists(supabase, options.actorProfileId);

  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", options.notificationId)
    .eq("recipient_profile_id", options.actorProfileId)
    .select(NOTIFICATION_ROW_SELECT)
    .maybeSingle<NotificationRow>();

  if (error) throw error;
  if (!data) {
    throw new NotificationsDomainError("NOTIFICATION_NOT_FOUND", {
      notificationId: options.notificationId,
    });
  }

  const unreadCount = await fetchUnreadCount(supabase, options.actorProfileId);

  return {
    item: mapNotificationRow(data),
    unreadCount,
  };
}

export async function markAllNotificationsReadForProfile(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
  }
): Promise<MarkAllNotificationsReadResponse> {
  await ensureProfileExists(supabase, options.actorProfileId);

  const beforeCount = await fetchUnreadCount(supabase, options.actorProfileId);

  if (beforeCount > 0) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_profile_id", options.actorProfileId)
      .eq("is_read", false);

    if (error) throw error;
  }

  return {
    updatedCount: beforeCount,
    unreadCount: 0,
  };
}

export async function createNotificationsForRecipients(
  options: {
    notifications: NotificationInsertInput[];
  }
): Promise<void> {
  if (options.notifications.length === 0) return;

  const serviceRoleClient = createServiceRoleClient();

  for (const notification of options.notifications) {
    const payload = {
      recipient_profile_id: notification.recipientProfileId,
      branch_id: notification.branchId ?? null,
      type: notification.type,
      severity: normalizeSeverity(notification.severity),
      title: notification.title,
      body: notification.body,
      payload_json: notification.payload ?? {},
      event_key: sanitizeText(notification.eventKey),
      created_by: notification.createdBy ?? null,
    };

    const { error } = await serviceRoleClient.from("notifications").insert(payload);

    if (!error) {
      continue;
    }

    // Ignore duplicate event-key fanout inserts (idempotent side-effects).
    if (error.code === "23505") {
      continue;
    }

    throw new NotificationsDomainError("NOTIFICATION_INSERT_FAILED", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload,
    });
  }
}

export async function fanoutNotificationToBranch(options: {
  branchId: string;
  type: string;
  title: string;
  body: string;
  payload?: NotificationPayloadDto;
  severity?: NotificationSeverity;
  eventKey?: string | null;
  createdBy?: string | null;
  recipientRoles?: ShowroomRole[];
}): Promise<void> {
  const serviceRoleClient = createServiceRoleClient();

  const { data, error } = await serviceRoleClient
    .from("profile_branch_access")
    .select("profile_id")
    .eq("branch_id", options.branchId)
    .eq("is_delete", false)
    .returns<BranchRecipientRow[]>();

  if (error) throw error;

  const profileIds = Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.profile_id)
        .filter((profileId): profileId is string => Boolean(profileId))
    )
  );

  if (profileIds.length === 0) {
    throw new NotificationsDomainError("NOTIFICATION_RECIPIENTS_NOT_FOUND", {
      branchId: options.branchId,
      recipientRoles: options.recipientRoles,
    });
  }

  const { data: profileRows, error: profileError } = await serviceRoleClient
    .from("profiles")
    .select("id, role, is_active")
    .in("id", profileIds)
    .returns<RecipientProfileRow[]>();

  if (profileError) throw profileError;

  const roleSet = options.recipientRoles && options.recipientRoles.length > 0
    ? new Set(options.recipientRoles)
    : null;

  const recipientIds = Array.from(
    new Set(
      (profileRows ?? [])
        .filter((row) => row.is_active)
        .filter((row) => (roleSet ? row.role && roleSet.has(row.role) : true))
        .map((row) => row.id)
        .filter((profileId): profileId is string => Boolean(profileId))
    )
  );

  if (recipientIds.length === 0) {
    throw new NotificationsDomainError("NOTIFICATION_RECIPIENTS_NOT_FOUND", {
      branchId: options.branchId,
      recipientRoles: options.recipientRoles,
    });
  }

  await createNotificationsForRecipients({
    notifications: recipientIds.map((recipientProfileId) => ({
      recipientProfileId,
      branchId: options.branchId,
      type: options.type,
      title: options.title,
      body: options.body,
      payload: options.payload,
      severity: options.severity,
      eventKey: options.eventKey,
      createdBy: options.createdBy,
    })),
  });
}
