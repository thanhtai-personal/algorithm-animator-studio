export interface FooterLinkEntry {
  label: string;
  href: string | null;
}

function normalize(value: string): string {
  return value.trim();
}

export function parseFooterLinkEntry(value: string): FooterLinkEntry {
  const raw = normalize(value);
  if (!raw) {
    return { label: "", href: null };
  }

  const separatorIndex = raw.indexOf("|");
  if (separatorIndex < 0) {
    return { label: raw, href: null };
  }

  const label = normalize(raw.slice(0, separatorIndex));
  const hrefCandidate = normalize(raw.slice(separatorIndex + 1));

  return {
    label,
    href: hrefCandidate.length > 0 ? hrefCandidate : null,
  };
}

export function serializeFooterLinkEntry(entry: FooterLinkEntry): string {
  const label = normalize(entry.label);
  const href = normalize(entry.href ?? "");
  if (!label) return "";
  if (!href) return label;
  return `${label} | ${href}`;
}

export function parseFooterLinkListValue(value: string): FooterLinkEntry[] {
  return value
    .split("\n")
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0 || entry.href);
}

export function serializeFooterLinkList(entries: FooterLinkEntry[]): string {
  return entries
    .map(serializeFooterLinkEntry)
    .map((entry) => entry.trim())
    .filter((entry, index, source) => entry.length > 0 && source.indexOf(entry) === index)
    .join("\n");
}
