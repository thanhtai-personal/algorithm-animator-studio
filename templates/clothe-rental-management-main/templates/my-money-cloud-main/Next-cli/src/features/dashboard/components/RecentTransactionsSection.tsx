"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { RecentTransactionsList } from "@/features/transactions/components/RecentTransactionsList";

interface RecentTransactionsSectionProps {
  month: Date;
}

export function RecentTransactionsSection({ month }: RecentTransactionsSectionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <RecentTransactionsList month={month} />
    </div>
  );
}
