import { NextResponse } from "next/server";
import { parseResetVersion } from "@/server/utils/reset";

export async function handleForceResetGet() {
  const version = parseResetVersion();
  return NextResponse.json(
    { version },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
