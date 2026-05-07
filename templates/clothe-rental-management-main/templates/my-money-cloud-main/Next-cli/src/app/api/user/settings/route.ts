import { NextRequest } from "next/server";
import { handleGetUserSettings, handlePatchUserSettings } from "@/server/services/userSettingsService";

// Disable caching for this route to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return handleGetUserSettings();
}

export async function PATCH(request: NextRequest) {
  return handlePatchUserSettings(request);
}
