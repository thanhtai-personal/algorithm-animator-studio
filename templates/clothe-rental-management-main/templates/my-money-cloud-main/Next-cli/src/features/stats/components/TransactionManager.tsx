import { TransactionDeleteDialog } from "@/features/stats/components/TransactionDeleteDialog";
import { TransactionDetailDialog } from "@/features/stats/components/TransactionDetailDialog";
import { TransactionFilters } from "@/features/stats/components/TransactionFilters";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { TransactionTypeFilters } from "@/features/stats/components/TransactionTypeFilters";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { useTransactionManager } from "@/features/stats/hooks/useTransactionManager";
import { observer } from "mobx-react-lite";

export const TransactionManager = observer(function TransactionManager() {
  const { t, state, actions, categories, localeCode, currency } = useTransactionManager();

  return (
    <div className="space-y-4">
      <TransactionFilters
        t={t}
        dateRange={state.dateRange}
        onDateChange={actions.setDateRange}
        onClearDate={actions.clearDateRange}
        formatRangeValue={actions.formatRangeValue}
        selectedCategory={state.selectedCategory}
        onCategoryChange={actions.setSelectedCategory}
        categories={categories}
        onOpenAdd={() => actions.setAddOpen(true)}
      />

      <TransactionTypeFilters
        t={t}
        filterIncome={state.filterIncome}
        filterExpense={state.filterExpense}
        onToggleIncome={actions.toggleIncome}
        onToggleExpense={actions.toggleExpense}
      />

      <TransactionList
        variant="stats"
        transactions={state.pageItems}
        localeCode={localeCode}
        currency={currency}
        onEdit={(tx) => actions.setEditTarget(tx)}
        onDelete={(tx) => actions.setDeleteTarget(tx)}
        onOpenDetail={(tx) => actions.setDetailTarget(tx)}
        t={t}
      />

      {state.loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : state.filteredCount === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.noTransactionsTitle")}</p>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("common.page", { current: state.page, total: state.totalPages })}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50"
              onClick={() => actions.setPage(Math.max(1, state.page - 1))}
              disabled={state.page === 1}
            >
              {t("common.previous")}
            </button>
            <button
              type="button"
              className="rounded-md border px-2 py-1 disabled:opacity-50"
              onClick={() => actions.setPage(Math.min(state.totalPages, state.page + 1))}
              disabled={state.page === state.totalPages}
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      <AddTransactionModal isOpen={state.addOpen} onClose={() => actions.setAddOpen(false)} onAdd={actions.handleAdd} />

      <EditTransactionModal
        open={Boolean(state.editTarget)}
        transaction={state.editTarget}
        onClose={() => actions.setEditTarget(null)}
        onSave={actions.handleSave}
        isSaving={false}
      />

      <TransactionDetailDialog
        open={Boolean(state.detailTarget)}
        transaction={state.detailTarget}
        onOpenChange={(open) => !open && actions.setDetailTarget(null)}
        detailTitle={state.detailTitle}
        t={t}
        formatAmount={actions.formatAmount}
        formatDateTime={actions.formatDateTime}
      />

      <TransactionDeleteDialog
        open={Boolean(state.deleteTarget)}
        onOpenChange={(open) => !open && actions.setDeleteTarget(null)}
        onConfirm={actions.handleDelete}
        labels={{
          title: t("transactions.deleteTitle"),
          cancel: t("common.cancel"),
          confirm: t("transactions.deleteAction"),
        }}
      />
    </div>
  );
})
