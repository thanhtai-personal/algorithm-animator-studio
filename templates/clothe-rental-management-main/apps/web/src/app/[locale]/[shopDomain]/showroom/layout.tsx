import type { ReactNode } from "react";
import { ShowroomShell } from "@/features/showroom/components/ShowroomShell";

interface ShopDomainShowroomLayoutProps {
  children: ReactNode;
}

export default function ShopDomainShowroomLayout({
  children,
}: ShopDomainShowroomLayoutProps) {
  return <ShowroomShell>{children}</ShowroomShell>;
}
