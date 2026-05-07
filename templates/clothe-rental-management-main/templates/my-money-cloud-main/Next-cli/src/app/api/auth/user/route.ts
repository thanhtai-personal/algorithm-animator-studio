import { NextRequest } from "next/server";
import { handleGetUser } from "@/server/services/authService";

export async function GET(request: NextRequest) {
  return handleGetUser(request);
}
