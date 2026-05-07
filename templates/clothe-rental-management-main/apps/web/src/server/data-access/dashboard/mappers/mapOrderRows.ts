import { DashboardOrderRowDto } from "@/types/dashboardOverview";
import { CustomerRefRow, DashboardOrderRow } from "../interfaces";
import { normalizeOrderStatus } from "../utils";

export function mapOrderRows(
  rows: DashboardOrderRow[],
  customerById: Map<string, CustomerRefRow>,
): DashboardOrderRowDto[] {
  return rows.map((row) => {
    const customer = customerById.get(row.customer_id);

    return {
      orderId: row.id,
      orderCode: row.order_code,
      customerName: customer?.full_name?.trim() || "Unknown customer",
      customerPhone: customer?.phone ?? null,
      status: normalizeOrderStatus(row.status),
      startDate: row.start_date,
      endDate: row.end_date,
      updatedAt: row.updated_at,
    };
  });
}