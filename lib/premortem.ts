export type PreMortemRisk = {
  id: string;
  risk: string;
  mitigation: string;
};

export type PreMortem = {
  id: string;
  projectName: string;
  date: string; // YYYY-MM-DD, when the exercise was run
  risks: PreMortemRisk[];
  notes: string;
  archived: boolean;
};

export type PreMortemData = {
  premortems: PreMortem[];
};

export function emptyPreMortemData(): PreMortemData {
  return { premortems: [] };
}

export function normalizePreMortemData(
  partial: Partial<PreMortemData> | null | undefined
): PreMortemData {
  return { premortems: Array.isArray(partial?.premortems) ? partial.premortems : [] };
}

export function newPreMortem(projectName: string, date: string): PreMortem {
  return {
    id: crypto.randomUUID(),
    projectName,
    date,
    risks: [],
    notes: "",
    archived: false,
  };
}

export function activePreMortems(data: PreMortemData): PreMortem[] {
  return data.premortems
    .filter((p) => !p.archived)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function addPreMortem(data: PreMortemData, premortem: PreMortem): PreMortemData {
  return { ...data, premortems: [premortem, ...data.premortems] };
}

export function updatePreMortem(
  data: PreMortemData,
  id: string,
  updater: (p: PreMortem) => PreMortem
): PreMortemData {
  return { ...data, premortems: data.premortems.map((p) => (p.id === id ? updater(p) : p)) };
}

export function archivePreMortem(data: PreMortemData, id: string): PreMortemData {
  return updatePreMortem(data, id, (p) => ({ ...p, archived: true }));
}

export function addRisk(data: PreMortemData, premortemId: string, risk: string): PreMortemData {
  return updatePreMortem(data, premortemId, (p) => ({
    ...p,
    risks: [...p.risks, { id: crypto.randomUUID(), risk, mitigation: "" }],
  }));
}

export function updateRisk(
  data: PreMortemData,
  premortemId: string,
  riskId: string,
  updater: (r: PreMortemRisk) => PreMortemRisk
): PreMortemData {
  return updatePreMortem(data, premortemId, (p) => ({
    ...p,
    risks: p.risks.map((r) => (r.id === riskId ? updater(r) : r)),
  }));
}

export function deleteRisk(data: PreMortemData, premortemId: string, riskId: string): PreMortemData {
  return updatePreMortem(data, premortemId, (p) => ({
    ...p,
    risks: p.risks.filter((r) => r.id !== riskId),
  }));
}
