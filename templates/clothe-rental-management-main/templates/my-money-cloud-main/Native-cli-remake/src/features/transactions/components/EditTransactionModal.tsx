import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import type { Transaction, TransactionInput } from "@/features/transactions/types";
import { useI18n } from "@/lib/i18n";

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSubmit: (payload: TransactionInput) => void;
};

export function EditTransactionModal({ visible, transaction, onClose, onSubmit }: Props) {
  const { t } = useI18n();
  const initial = transaction
    ? {
        amount: transaction.amount,
        description: transaction.description ?? "",
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: transaction.date,
      }
    : null;
  return (
    <AddTransactionModal
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      initial={initial}
      submitLabel={t("common.save") ?? "Save"}
      title={t("transactions.editTitle") ?? "Edit transaction"}
    />
  );
}
