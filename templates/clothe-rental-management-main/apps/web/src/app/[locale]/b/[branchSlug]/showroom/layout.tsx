import type { ReactNode } from "react";
import { ShowroomShell } from "@/features/showroom/components/ShowroomShell";

interface BranchShowroomLayoutProps {
  children: ReactNode;
}

export default function BranchShowroomLayout({ children }: BranchShowroomLayoutProps) {
  return <ShowroomShell>{children}</ShowroomShell>;
}
