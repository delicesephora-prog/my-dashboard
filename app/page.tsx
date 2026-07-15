import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const data = await getDashboardData();
    return <Dashboard initialData={data} />;
  } catch (err) {
    // Never fall back to a blank dashboard on a load failure - that blank
    // state is fully editable, and the very next autosave would overwrite
    // real data in the database with nothing. Show the real error instead
    // and stop here, so nothing gets a chance to save over anything.
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper-bg px-6">
        <div className="w-full max-w-sm rounded-xl2 border border-[#B5574A] bg-paper-surface p-6 shadow-paper">
          <h1 className="mb-2 font-serif text-xl text-paper-ink">Couldn&apos;t load your dashboard</h1>
          <p className="mb-3 text-sm leading-relaxed text-paper-muted">
            Nothing has been changed or lost - the app stopped here on purpose instead of showing
            you a blank dashboard. Screenshot or copy the message below if you need help:
          </p>
          <p className="mb-4 rounded-lg border border-paper-border bg-paper-surface2 p-3 text-[12px] leading-snug text-paper-ink">
            {message}
          </p>
          <a
            href="/"
            className="block w-full rounded-xl2 bg-work py-3 text-center text-sm font-medium text-paper-surface"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }
}
