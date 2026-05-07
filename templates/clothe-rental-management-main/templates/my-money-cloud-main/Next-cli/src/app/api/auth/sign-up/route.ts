import { NextRequest } from "next/server";
import { handleSignUp } from "@/server/services/authService";

export async function POST(request: NextRequest) {
  return handleSignUp(request);
}
