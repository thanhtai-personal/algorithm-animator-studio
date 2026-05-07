import { NextRequest } from "next/server";
import { handleGetCalendarEvents } from "@/server/services/calendarService";

export async function GET(request: NextRequest) {
  return handleGetCalendarEvents(request);
}
