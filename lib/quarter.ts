export function quarterKeyFor(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

export function shiftQuarterKey(key: string, delta: number): string {
  const [yStr, qStr] = key.split("-Q");
  const y = Number(yStr);
  const q = Number(qStr);
  const total = y * 4 + (q - 1) + delta;
  const newY = Math.floor(total / 4);
  const newQ = ((total % 4) + 4) % 4;
  return `${newY}-Q${newQ + 1}`;
}

export function formatQuarterLabel(key: string): string {
  const [y, q] = key.split("-Q");
  return `Q${q} ${y}`;
}
