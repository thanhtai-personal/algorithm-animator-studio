export interface BrickPatternCell {
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: number;
  wear: number;
}

function seeded(row: number, column: number, salt: number) {
  const raw = Math.sin(row * 91.17 + column * 37.31 + salt * 17.73) * 43_758.5453;
  return raw - Math.floor(raw);
}

export function buildBrickPattern(
  width: number,
  height: number,
  brickWidth = 84,
  brickHeight = 38,
): BrickPatternCell[] {
  const safeWidth = Math.max(8, brickWidth);
  const safeHeight = Math.max(6, brickHeight);
  const rows = Math.ceil(height / safeHeight) + 2;
  const columns = Math.ceil(width / safeWidth) + 3;
  const cells: BrickPatternCell[] = [];

  for (let row = -1; row < rows; row += 1) {
    const offset = Math.abs(row) % 2 === 1 ? -safeWidth * 0.5 : 0;
    for (let column = -1; column < columns; column += 1) {
      cells.push({
        row,
        column,
        x: column * safeWidth + offset,
        y: row * safeHeight,
        width: safeWidth,
        height: safeHeight,
        tone: Math.round(seeded(row, column, 3) * 12),
        wear: seeded(row, column, 11),
      });
    }
  }
  return cells;
}
