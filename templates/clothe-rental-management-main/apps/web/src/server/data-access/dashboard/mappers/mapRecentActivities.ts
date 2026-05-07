import { DashboardActivityRowDto } from "@/types/dashboardOverview";
import { AuditEventRow, ProfileNameRow } from "../interfaces";
import { sanitizeText } from "../utils";

export function mapRecentActivities(
  rows: AuditEventRow[],
  actorById: Map<string, ProfileNameRow>,
): DashboardActivityRowDto[] {
  return rows.map((row) => {
    const actor = row.actor_profile_id
      ? actorById.get(row.actor_profile_id)
      : null;

    return {
      id: row.id,
      createdAt: row.created_at,
      actorProfileId: row.actor_profile_id,
      actorName: actor?.full_name?.trim() || null,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      reason: sanitizeText(row.reason),
    };
  });
}