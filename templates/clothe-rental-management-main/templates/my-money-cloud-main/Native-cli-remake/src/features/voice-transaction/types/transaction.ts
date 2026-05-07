export type TransactionType = "income" | "expense";

export type CategoryType =
  | "salary"
  | "bonus"
  | "investment"
  | "gift_received"
  | "other_income"
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "health"
  | "education"
  | "bills"
  | "gift_given"
  | "other_expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: CategoryType | string;
  amount: number;
  note: string;
  createdAt: Date;
}

export const categoryLabels: Record<CategoryType, string> = {
  salary: "Lương",
  bonus: "Thưởng",
  investment: "Đầu tư",
  gift_received: "Quà tặng",
  other_income: "Thu khác",
  food: "Ăn uống",
  transport: "Di chuyển",
  shopping: "Mua sắm",
  entertainment: "Giải trí",
  health: "Sức khỏe",
  education: "Học tập",
  bills: "Hóa đơn",
  gift_given: "Tặng quà",
  other_expense: "Chi khác",
};

export const categoryIcons: Record<CategoryType, string> = {
  salary: "💰",
  bonus: "🎁",
  investment: "📈",
  gift_received: "🎀",
  other_income: "💵",
  food: "🍜",
  transport: "🚗",
  shopping: "🛍️",
  entertainment: "🎬",
  health: "💊",
  education: "📚",
  bills: "📄",
  gift_given: "🎁",
  other_expense: "💸",
};
