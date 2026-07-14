import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/db";
import { defaultDashboardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    // Falls back to a blank dashboard (e.g. DATABASE_URL not set yet during
    // first-time setup) so the page still renders instead of crashing.
    data = defaultDashboardData();
  }

  return <Dashboard initialData={data} />;
}
