import type { ReactNode } from "react";
import { ShowroomShell } from "@/features/showroom/components/ShowroomShell";

interface ShowroomLayoutProps {
  children: ReactNode;
}

export default function ShowroomLayout({ children }: ShowroomLayoutProps) {
  return <ShowroomShell>{children}</ShowroomShell>;
}
