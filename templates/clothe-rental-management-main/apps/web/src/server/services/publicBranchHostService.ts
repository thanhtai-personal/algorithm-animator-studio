function sanitizeHost(rawHost: string | null | undefined): string | null {
  if (typeof rawHost !== "string") return null;
  const firstHost = rawHost.split(",")[0] ?? "";
  const trimmed = firstHost.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutPort = trimmed.replace(/:\d+$/, "");
  const withoutTrailingDot = withoutPort.replace(/\.$/, "");
  return withoutTrailingDot || null;
}

function isIpv4(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function isIpv6(host: string): boolean {
  return host.includes(":");
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost");
}

function isValidSubdomainSlug(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function resolveConfiguredBaseHost(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return null;

  try {
    const parsed = new URL(siteUrl);
    const host = sanitizeHost(parsed.hostname);
    if (!host || isLocalHost(host) || isIpv4(host) || isIpv6(host)) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function resolveShopDomainFromHost(
  rawHost: string | null | undefined
): string | null {
  const host = sanitizeHost(rawHost);
  if (!host || isIpv4(host) || isIpv6(host)) {
    return null;
  }

  if (isLocalHost(host)) {
    if (!host.endsWith(".localhost")) return null;
    const candidate = host.split(".")[0] ?? null;
    return isValidSubdomainSlug(candidate) ? candidate : null;
  }

  const configuredBaseHost = resolveConfiguredBaseHost();
  if (configuredBaseHost) {
    if (host === configuredBaseHost) return null;

    const suffix = `.${configuredBaseHost}`;
    if (host.endsWith(suffix)) {
      const prefix = host.slice(0, -suffix.length);
      const firstSegment = prefix.split(".")[0] ?? null;
      return isValidSubdomainSlug(firstSegment) ? firstSegment : null;
    }
  }

  const labels = host.split(".");
  if (labels.length < 3) return null;

  const candidate = labels[0] ?? null;
  if (!candidate || candidate === "www") return null;
  return isValidSubdomainSlug(candidate) ? candidate : null;
}
