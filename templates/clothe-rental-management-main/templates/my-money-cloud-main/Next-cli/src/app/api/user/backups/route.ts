import { NextRequest } from "next/server";
import { handleCreateUserBackup } from "@/server/services/userBackupService";

export async function POST(request: NextRequest) {
  return handleCreateUserBackup(request);
}
