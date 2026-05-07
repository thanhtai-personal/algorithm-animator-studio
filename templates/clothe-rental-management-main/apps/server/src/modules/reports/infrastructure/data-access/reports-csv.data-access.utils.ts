function escapeCsv(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  const lines = [headers.map(escapeCsv).join(',')];

  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }

  return lines.join('\n');
}
