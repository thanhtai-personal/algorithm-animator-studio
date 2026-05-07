import { NextRequest } from "next/server";
import { handleSignOut } from "@/server/services/authService";

export async function POST(request: NextRequest) {
  return handleSignOut(request);
}
