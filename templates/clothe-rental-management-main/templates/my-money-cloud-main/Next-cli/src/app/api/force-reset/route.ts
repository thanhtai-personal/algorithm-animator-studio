import { handleForceResetGet } from "@/server/services/forceResetService";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleForceResetGet();
}
