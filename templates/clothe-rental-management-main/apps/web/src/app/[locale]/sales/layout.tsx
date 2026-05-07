import type { ReactNode } from "react";
import { SalesLayout } from "@/features/sales/components/SalesLayout";

interface SalesRouteLayoutProps {
  children: ReactNode;
}

export default function SalesRouteLayout({ children }: SalesRouteLayoutProps) {
  return <SalesLayout>{children}</SalesLayout>;
}
