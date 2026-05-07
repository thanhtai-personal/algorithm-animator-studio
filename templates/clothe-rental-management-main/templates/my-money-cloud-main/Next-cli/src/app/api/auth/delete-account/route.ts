import { NextRequest } from "next/server";
import { handleDeleteAccount } from "@/server/services/authService";

export async function DELETE(request: NextRequest) {
  return handleDeleteAccount(request);
}
