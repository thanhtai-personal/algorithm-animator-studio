import { Check, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/utils";

interface TypeStepProps {
  transactionType: "income" | "expense";
  onSelectType: (type: "income" | "expense") => void;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionTypeStep({ transactionType, onSelectType, t }: TypeStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <p className="text-center text-muted-foreground">
        {t("addTransaction.selectTypeDescription")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <TypeCard
          type="expense"
          isActive={transactionType === "expense"}
          onClick={() => onSelectType("expense")}
          title={t("common.expense")}
          subtitle={t("addTransaction.expenseDescription")}
        />
        <TypeCard
          type="income"
          isActive={transactionType === "income"}
          onClick={() => onSelectType("income")}
          title={t("common.income")}
          subtitle={t("addTransaction.incomeDescription")}
        />
      </div>
    </div>
  );
}

interface TypeCardProps {
  type: "income" | "expense";
  isActive: boolean;
  onClick: () => void;
  title?: string;
  subtitle?: string;
}

function TypeCard({ type, isActive, onClick, title, subtitle }: TypeCardProps) {
  const isExpense = type === "expense";
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-4 md:p-5 rounded-2xl border-2 transition-all duration-200",
        "flex flex-col items-center gap-3",
        isActive
          ? isExpense
            ? "bg-red-500 border-red-500 text-white shadow-lg"
            : "bg-green-500 border-green-500 text-white shadow-lg"
          : "bg-card/90 border-border hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <div
        className={cn(
          "w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center",
          isActive ? "bg-white/20" : isExpense ? "bg-red-100" : "bg-green-100"
        )}
      >
        {isExpense ? (
          <ArrowDownCircle className={cn("h-8 w-8", isActive ? "text-white" : "text-red-500")} />
        ) : (
          <ArrowUpCircle className={cn("h-8 w-8", isActive ? "text-white" : "text-green-500")} />
        )}
      </div>
      <div className="text-center">
        <p className={cn("text-lg font-bold", isActive ? "text-white" : "text-foreground")}>
          {title}
        </p>
        <p className={cn("text-xs md:text-sm mt-1", isActive ? "text-white/80" : "text-muted-foreground")}>
          {subtitle}
        </p>
      </div>
      {isActive && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </button>
  );
}
