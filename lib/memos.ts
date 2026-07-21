// A free-form weekly memo - one text field per week, keyed by weekKey (the
// Monday's date), same keying convention as FridayLedgerData.
export type MemosData = {
  entries: Record<string, string>;
};

export function emptyMemosData(): MemosData {
  return { entries: {} };
}

export function normalizeMemosData(partial: Partial<MemosData> | null | undefined): MemosData {
  return { entries: partial?.entries ?? {} };
}

export function memoFor(data: MemosData, weekKey: string): string {
  return data.entries[weekKey] ?? "";
}

export function setMemo(data: MemosData, weekKey: string, text: string): MemosData {
  return { ...data, entries: { ...data.entries, [weekKey]: text } };
}
