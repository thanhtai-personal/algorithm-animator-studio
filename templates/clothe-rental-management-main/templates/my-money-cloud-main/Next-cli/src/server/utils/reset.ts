export function parseResetVersion(): string {
  const raw = process.env.FORCE_RESET_LOCAL_DATA ?? process.env.NEXT_PUBLIC_FORCE_RESET_LOCAL_DATA ?? "0.0.0";
  return String(raw);
}
