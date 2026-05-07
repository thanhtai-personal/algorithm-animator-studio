import { NextRequest } from "next/server";
import { handleAiParse } from "@/server/services/aiService";

export async function POST(request: NextRequest) {
  return handleAiParse(request);
}
