"use client";

import { LifeQuarterly, MoneyData } from "@/lib/types";
import { PaydayChecklistData } from "@/lib/payday";
import MoneySection from "./quarter/MoneySection";
import PaydayChecklistSection from "./quarter/PaydayChecklistSection";

export default function MoneyView({
  lifeQuarterly,
  onChange,
}: {
  lifeQuarterly: LifeQuarterly;
  onChange: (updater: (lq: LifeQuarterly) => LifeQuarterly) => void;
}) {
  function updateMoney(updater: (m: MoneyData) => MoneyData) {
    onChange((lq) => ({ ...lq, money: updater(lq.money) }));
  }

  function updatePaydayChecklist(updater: (p: PaydayChecklistData) => PaydayChecklistData) {
    onChange((lq) => ({ ...lq, paydayChecklist: updater(lq.paydayChecklist) }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Money
        </p>
        <p className="font-serif text-[1.05rem] text-paper-ink">Vaults, Debt Snowball &amp; Payday</p>
      </div>

      <div className="flex flex-col gap-3">
        <MoneySection money={lifeQuarterly.money} onChange={updateMoney} />
        <PaydayChecklistSection data={lifeQuarterly.paydayChecklist} onChange={updatePaydayChecklist} />
      </div>
    </div>
  );
}
