"use client";

import { useState } from "react";
import { ChevronDown, Receipt, Trash2, Edit } from "lucide-react";
import { Transaction } from "../types/transaction";
import { TransactionCard } from "./TransactionCard";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";

interface TransactionDrawerProps {
  transactions: Transaction[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionDrawer({
  transactions,
  isOpen,
  onToggle,
  onDelete,
  onEdit,
}: TransactionDrawerProps) {
  const { currency, localeCode } = useI18n();
  
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-[calc(100%-140px)]"
        )}
      >
        {/* Handle */}
        <div className="flex flex-col items-center pt-3 pb-4 cursor-pointer" onClick={onToggle}>
          <div className="w-12 h-1.5 rounded-full bg-muted mb-4" />

          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>

        {/* Summary */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-lg">
                Giao dịch ({transactions.length})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-100 dark:bg-green-950 rounded-2xl p-3">
              <p className="text-sm text-muted-foreground">Thu nhập</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(totalIncome, currency, localeCode)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-950 rounded-2xl p-3">
              <p className="text-sm text-muted-foreground">Chi tiêu</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(totalExpense, currency, localeCode)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div
          className="px-6 pb-8 overflow-y-auto"
          style={{ maxHeight: "50vh" }}
        >
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có giao dịch nào</p>
              <p className="text-sm mt-1">Nhấn giữ nút micro để thêm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
