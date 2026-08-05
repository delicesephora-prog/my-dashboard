// The one shared department/category list for anything business-side -
// Work tasks and Cadence both file under these same 9 values, so a task
// filed under "Finance" and a Cadence checklist item under "Finance" are
// always talking about the same thing. Planner stays separate on purpose -
// it's personal/lifestyle time-blocking (Date Night, Girls' Night, etc.),
// not a business department list, and keeps its own user-managed categories.
export type Department =
  | "Clinical Operations"
  | "Executive Support"
  | "Investor Relations"
  | "Finance"
  | "Translation"
  | "Vendor Management"
  | "Facilities"
  | "Regulatory"
  | "Administration";

export const DEPARTMENTS: Department[] = [
  "Clinical Operations",
  "Executive Support",
  "Investor Relations",
  "Finance",
  "Translation",
  "Vendor Management",
  "Facilities",
  "Regulatory",
  "Administration",
];

// One-time migration for data saved before "Career" was retired (folded
// into Administration) and "Vendor" was renamed to "Vendor Management" -
// applied wherever a department string comes back out of storage, so an
// old Cadence item, task, or vendor record still lands on a value the
// current Department type actually allows, instead of failing its next
// save. Anything already valid passes through untouched.
const LEGACY_DEPARTMENT_MAP: Record<string, Department> = {
  Career: "Administration",
  Vendor: "Vendor Management",
};

export function remapLegacyDepartment(value: string): Department {
  const mapped = LEGACY_DEPARTMENT_MAP[value];
  if (mapped) return mapped;
  return (DEPARTMENTS as string[]).includes(value) ? (value as Department) : "Administration";
}
