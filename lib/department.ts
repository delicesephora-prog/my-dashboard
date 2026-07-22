// The one shared department/category list for anything business-side -
// Work tasks and Cadence both file under these same 10 values, so a task
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
  | "Vendor"
  | "Facilities"
  | "Regulatory"
  | "Administration"
  | "Career";

export const DEPARTMENTS: Department[] = [
  "Clinical Operations",
  "Executive Support",
  "Investor Relations",
  "Finance",
  "Translation",
  "Vendor",
  "Facilities",
  "Regulatory",
  "Administration",
  "Career",
];
