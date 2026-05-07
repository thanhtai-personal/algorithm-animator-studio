import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MESSAGE = "Vui lòng cập nhật để tiếp tục.";

function normalizeValue(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function compareVersions(left: string, right: string): number {
  const toParts = (value: string) =>
    value
      .split(".")
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0));
  const leftParts = toParts(left);
  const rightParts = toParts(right);
  const maxLen = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLen; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? "";
  const currentVersion = normalizeValue(searchParams.get("current")) ?? "0.0.0";

  const latestVersion = normalizeValue(process.env.APP_VERSION_LATEST) ?? "1.0.0";
  const minVersion = normalizeValue(process.env.APP_VERSION_MIN) ?? latestVersion;
  const effectiveForceUpdate = compareVersions(currentVersion, minVersion) < 0;
  const message = normalizeValue(process.env.APP_UPDATE_MESSAGE) ?? DEFAULT_MESSAGE;

  let storeUrl = normalizeValue(process.env.APP_STORE_URL);
  if (platform === "android") {
    storeUrl = normalizeValue(process.env.NEXT_PUBLIC_APP_STORE_URL_ANDROID) ?? storeUrl;
  }
  if (platform === "ios") {
    storeUrl = normalizeValue(process.env.NEXT_PUBLIC_APP_STORE_URL_IOS) ?? storeUrl;
  }

  return NextResponse.json({
    latest_version: latestVersion,
    min_version: minVersion,
    force_update: effectiveForceUpdate,
    store_url: storeUrl,
    message,
  });
}
