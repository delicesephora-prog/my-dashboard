import { WorkTaskCategory } from "./types";
import { remapLegacyDepartment } from "./department";

export type Vendor = {
  id: string;
  name: string;
  category: WorkTaskCategory;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  archived: boolean;
};

export type VendorsData = {
  vendors: Vendor[];
};

export function emptyVendorsData(): VendorsData {
  return { vendors: [] };
}

export function normalizeVendorsData(
  partial: Partial<VendorsData> | null | undefined
): VendorsData {
  const vendors = Array.isArray(partial?.vendors) ? partial.vendors : [];
  // See remapLegacyDepartment - folds any vendor filed under a retired
  // department name onto its current home.
  return { vendors: vendors.map((v) => ({ ...v, category: remapLegacyDepartment(v.category) })) };
}

export function newVendor(name: string, category: WorkTaskCategory): Vendor {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    contactName: "",
    email: "",
    phone: "",
    notes: "",
    archived: false,
  };
}

export function activeVendors(data: VendorsData): Vendor[] {
  return data.vendors.filter((v) => !v.archived).sort((a, b) => a.name.localeCompare(b.name));
}

export function addVendor(data: VendorsData, vendor: Vendor): VendorsData {
  return { ...data, vendors: [vendor, ...data.vendors] };
}

export function updateVendor(
  data: VendorsData,
  id: string,
  updater: (v: Vendor) => Vendor
): VendorsData {
  return { ...data, vendors: data.vendors.map((v) => (v.id === id ? updater(v) : v)) };
}

export function archiveVendor(data: VendorsData, id: string): VendorsData {
  return updateVendor(data, id, (v) => ({ ...v, archived: true }));
}
