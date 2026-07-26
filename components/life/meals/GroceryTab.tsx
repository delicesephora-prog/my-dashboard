"use client";

import {
  GroceryHaul,
  MealCalendarData,
  MealCalendarMonth,
  haulActualTotal,
  haulEstimatedTotal,
  monthActualSpend,
  monthEstimatedSpend,
  monthFlex,
  setBudgetAmount,
  setStoreAmount,
} from "@/lib/mealcalendar";
import DonutChart from "@/components/DonutChart";
import TrendLineChart from "@/components/TrendLineChart";

const HAUL_COLORS = ["#B08B4F", "#5B2333"];

export default function GroceryTab({
  month,
  monthData,
  onChange,
}: {
  month: string;
  monthData: MealCalendarMonth;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
}) {
  if (monthData.budget.hauls.length === 0) {
    return (
      <p className="py-8 text-center font-serif text-[0.95rem] italic text-paper-muted">
        No grocery plan seeded for this month yet.
      </p>
    );
  }

  const estimatedSpend = monthEstimatedSpend(monthData);
  const actualSpend = monthActualSpend(monthData);
  const flex = monthFlex(monthData);

  const donutSegments = monthData.budget.hauls.map((h, i) => ({
    label: h.title,
    value: haulEstimatedTotal(h),
    color: HAUL_COLORS[i % HAUL_COLORS.length],
  }));
  if (flex > 0) donutSegments.push({ label: "Flex remaining", value: flex, color: "#8A9B7C" });

  const trendPoints = [
    { label: "Start", value: 0 },
    ...monthData.budget.hauls.map((h, i) => ({
      label: `Haul ${i + 1}`,
      value: monthData.budget.hauls.slice(0, i + 1).reduce((sum, hh) => sum + haulActualTotal(hh), 0),
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-[15px] text-paper-ink">Monthly grocery budget</p>
            <p className="text-[11.5px] text-paper-muted">Edit any number below - everything recalculates.</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-serif text-[18px] text-gold">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={monthData.budget.budgetAmount}
              onChange={(e) => onChange((d) => setBudgetAmount(d, month, Number(e.target.value) || 0))}
              className="w-20 rounded-lg border border-gold/40 bg-paper-surface2 px-2 py-1.5 text-right font-serif text-[18px] font-semibold text-gold outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-around">
          <DonutChart segments={donutSegments} centerValue={estimatedSpend} centerSuffix="$" size={120} />
          <div className="w-full max-w-[240px]">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">
              Actual spend so far
            </p>
            <TrendLineChart points={trendPoints} color="#5B2333" heightPx={70} />
          </div>
        </div>

        <div
          className={`mt-3 rounded-xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed text-paper-muted ${
            flex < 0 ? "border-[#B5574A]" : "border-paper-border"
          }`}
        >
          <b className="text-paper-ink">Budget math:</b> ${estimatedSpend.toFixed(0)} estimated of $
          {monthData.budget.budgetAmount.toFixed(0)} budget, leaving{" "}
          <b className={flex < 0 ? "text-[#B5574A]" : "text-sage"}>${flex.toFixed(0)}</b> flex.
          {flex < 0 ? " You're over - trim a store estimate or bump the budget." : " Real spend logged: $" + actualSpend.toFixed(0) + "."}
        </div>
      </div>

      {monthData.budget.hauls.map((haul) => (
        <HaulCard
          key={haul.id}
          month={month}
          haul={haul}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function HaulCard({
  month,
  haul,
  onChange,
}: {
  month: string;
  haul: GroceryHaul;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
}) {
  return (
    <div className="rounded-xl2 border border-gold/25 bg-paper-surface2 p-4 shadow-paper">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-serif text-[17px] text-paper-ink">{haul.title}</p>
          <p className="text-[11.5px] text-paper-muted">{haul.sub}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[18px] text-gold">${haulEstimatedTotal(haul).toFixed(0)} est</p>
          <p className="text-[11px] text-paper-muted">${haulActualTotal(haul).toFixed(0)} actual</p>
        </div>
      </div>

      {haul.stores.map((store) => (
        <div key={store.id} className="mt-3">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13.5px] font-medium text-paper-ink">{store.store}</span>
            <div className="flex items-center gap-3 text-[12.5px]">
              <label className="flex items-center gap-1 text-paper-muted">
                Est
                <input
                  type="number"
                  inputMode="decimal"
                  value={store.estimatedAmount}
                  onChange={(e) =>
                    onChange((d) =>
                      setStoreAmount(d, month, haul.id, store.id, "estimatedAmount", Number(e.target.value) || 0)
                    )
                  }
                  className="w-16 rounded-md border border-paper-border bg-paper-surface px-1.5 py-1 text-right text-gold outline-none"
                />
              </label>
              <label className="flex items-center gap-1 text-paper-muted">
                Actual
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="-"
                  value={store.actualAmount ?? ""}
                  onChange={(e) =>
                    onChange((d) =>
                      setStoreAmount(
                        d,
                        month,
                        haul.id,
                        store.id,
                        "actualAmount",
                        e.target.value === "" ? null : Number(e.target.value) || 0
                      )
                    )
                  }
                  className="w-16 rounded-md border border-paper-border bg-paper-surface px-1.5 py-1 text-right text-life outline-none"
                />
              </label>
            </div>
          </div>
          <ul className="flex flex-col gap-0.5">
            {store.items.map((item) => (
              <li key={item} className="flex gap-1.5 text-[12px] leading-relaxed text-paper-muted">
                <span className="text-gold">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
