export type Principal = {
  id: string;
  name: string;
  role: string;
  org: string;
  contactInfo: string; // free text - email, phone, whatever's useful
  notes: string; // background, how to work with them, preferences
  archived: boolean;
};

export type PrincipalsData = {
  principals: Principal[];
};

export function emptyPrincipalsData(): PrincipalsData {
  return { principals: [] };
}

export function normalizePrincipalsData(
  partial: Partial<PrincipalsData> | null | undefined
): PrincipalsData {
  return { principals: Array.isArray(partial?.principals) ? partial.principals : [] };
}

export function newPrincipal(name: string, role: string, org: string): Principal {
  return {
    id: crypto.randomUUID(),
    name,
    role,
    org,
    contactInfo: "",
    notes: "",
    archived: false,
  };
}

export function activePrincipals(data: PrincipalsData): Principal[] {
  return data.principals.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name));
}

export function addPrincipal(data: PrincipalsData, principal: Principal): PrincipalsData {
  return { ...data, principals: [principal, ...data.principals] };
}

export function updatePrincipal(
  data: PrincipalsData,
  id: string,
  updater: (p: Principal) => Principal
): PrincipalsData {
  return { ...data, principals: data.principals.map((p) => (p.id === id ? updater(p) : p)) };
}

export function archivePrincipal(data: PrincipalsData, id: string): PrincipalsData {
  return updatePrincipal(data, id, (p) => ({ ...p, archived: true }));
}
