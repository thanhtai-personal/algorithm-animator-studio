import { computeOrderCogsAmount } from "../../orderFinance";
import { RevenueOrderRow, RevenueOrderItemCogsRow } from "../interfaces";
import { parseNumeric, roundMoney } from "../utils";

export function buildRevenueOrderFinancialContextMap(options: {
  orders: RevenueOrderRow[];
  orderItemCogsRows: RevenueOrderItemCogsRow[];
}): Map<
  string,
  {
    receivableAmount: number;
    cogsAmount: number;
  }
> {
  const saleItemCogsByOrderId = new Map<string, number[]>();
  for (const row of options.orderItemCogsRows) {
    const bucket = saleItemCogsByOrderId.get(row.order_id);
    const cogsValue = roundMoney(
      Math.max(0, parseNumeric(row.cogs_snapshot_amount)),
    );

    if (bucket) {
      bucket.push(cogsValue);
    } else {
      saleItemCogsByOrderId.set(row.order_id, [cogsValue]);
    }
  }

  const contextByOrderId = new Map<
    string,
    {
      receivableAmount: number;
      cogsAmount: number;
    }
  >();

  for (const order of options.orders) {
    contextByOrderId.set(order.id, {
      receivableAmount: roundMoney(
        Math.max(0, parseNumeric(order.total_amount)),
      ),
      cogsAmount: computeOrderCogsAmount({
        orderType: order.order_type,
        saleItemCostSnapshots: saleItemCogsByOrderId.get(order.id) ?? [],
      }),
    });
  }

  return contextByOrderId;
}