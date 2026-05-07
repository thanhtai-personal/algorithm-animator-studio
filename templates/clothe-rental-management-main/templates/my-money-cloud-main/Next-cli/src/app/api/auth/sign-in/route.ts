import { NextRequest } from "next/server";
import { handleSignIn } from "@/server/services/authService";

export async function POST(request: NextRequest) {
  return handleSignIn(request);
}
