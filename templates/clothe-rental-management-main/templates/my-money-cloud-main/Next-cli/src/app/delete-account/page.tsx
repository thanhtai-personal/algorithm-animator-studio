import type { Metadata } from "next";
import { DeleteAccountCard } from "@/features/account/components/DeleteAccountCard";

export const metadata: Metadata = {
  title: "Xóa tài khoản - SpendSmart",
  description: "Xóa tài khoản và dữ liệu khỏi SpendSmart.",
};

export default function DeleteAccountPage() {
  return (
    <DeleteAccountCard />
  );
}
