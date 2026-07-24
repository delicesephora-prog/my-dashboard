"use client";

import { Debt, MoneyData, Vault } from "@/lib/types";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Her real vault balances carry meaningful cents (e.g. $700.62) - the
// rounded formatMoney above is only for the debt summary line, which was
// always whole-dollar.
function formatMoneyCents(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function InlineAmount({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-24 rounded-md border border-transparent bg-transparent px-1 text-right font-serif text-[15px] text-paper-ink outline-none transition-colors focus:border-paper-border focus:bg-paper-surface2"
    />
  );
}

export default function MoneySection({
  money,
  onChange,
}: {
  money: MoneyData;
  onChange: (updater: (m: MoneyData) => MoneyData) => void;
}) {
  function addVault() {
    const vault: Vault = { id: crypto.randomUUID(), name: "New Vault", currentAmount: 0, goalAmount: 0 };
    onChange((m) => ({ ...m, vaults: [...m.vaults, vault] }));
  }

  function moveVault(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= money.vaults.length) return;
    onChange((m) => {
      const vaults = [...m.vaults];
      [vaults[index], vaults[target]] = [vaults[target], vaults[index]];
      return { ...m, vaults };
    });
  }

  const vaultTotal = money.vaults.reduce((sum, v) => sum + v.currentAmount, 0);

  function addDebt() {
    const debt: Debt = {
      id: crypto.randomUUID(),
      name: "New Debt",
      currentBalance: 0,
      startingBalance: 0,
      interestRatePct: 0,
      minPayment: 0,
      dueDay: 0,
      status: "current",
      pastDueAmount: 0,
      priority: false,
      notes: "",
    };
    onChange((m) => ({ ...m, debts: [...m.debts, debt] }));
  }

  const totalStarting = money.debts.reduce((sum, d) => sum + d.startingBalance, 0);
  const totalPaid = money.debts.reduce(
    (sum, d) => sum + Math.max(0, d.startingBalance - d.currentBalance),
    0
  );
  const totalPct = totalStarting > 0 ? Math.min(100, Math.round((totalPaid / totalStarting) * 100)) : 0;
  const sortedDebts = [...money.debts].sort((a, b) => a.startingBalance - b.startingBalance);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Vaults
          </p>
          <button
            type="button"
            onClick={addVault}
            className="rounded-full bg-life px-3 py-1 text-xs font-medium text-paper-surface"
          >
            + Add Vault
          </button>
        </div>
        <p className="mb-3 font-serif text-2xl text-paper-ink">{formatMoneyCents(vaultTotal)}</p>

        {money.vaults.length === 0 ? (
          <p className="py-2 text-center text-xs italic text-paper-muted">No vaults yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {money.vaults.map((vault, index) => {
              const hasGoal = vault.goalAmount > 0;
              const pct = hasGoal ? Math.min(100, (vault.currentAmount / vault.goalAmount) * 100) : 0;
              return (
                <div key={vault.id}>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        aria-label="Move vault up"
                        disabled={index === 0}
                        onClick={() => moveVault(index, -1)}
                        className="leading-none text-paper-faint disabled:opacity-25"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="Move vault down"
                        disabled={index === money.vaults.length - 1}
                        onClick={() => moveVault(index, 1)}
                        className="leading-none text-paper-faint disabled:opacity-25"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      value={vault.name}
                      onChange={(e) =>
                        onChange((m) => ({
                          ...m,
                          vaults: m.vaults.map((v) =>
                            v.id === vault.id ? { ...v, name: e.target.value } : v
                          ),
                        }))
                      }
                      className="min-w-0 flex-1 bg-transparent text-[14px] text-paper-ink outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-1 text-[13px] text-paper-muted">
                      <InlineAmount
                        value={vault.currentAmount}
                        onChange={(n) =>
                          onChange((m) => ({
                            ...m,
                            vaults: m.vaults.map((v) =>
                              v.id === vault.id ? { ...v, currentAmount: n } : v
                            ),
                          }))
                        }
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={vault.goalAmount || ""}
                        placeholder="goal"
                        onChange={(e) =>
                          onChange((m) => ({
                            ...m,
                            vaults: m.vaults.map((v) =>
                              v.id === vault.id ? { ...v, goalAmount: Number(e.target.value) || 0 } : v
                            ),
                          }))
                        }
                        className="w-16 rounded-md border border-transparent bg-transparent px-1 text-right font-serif text-[15px] text-paper-ink outline-none placeholder:font-sans placeholder:text-[11px] placeholder:italic placeholder:text-paper-faint transition-colors focus:border-paper-border focus:bg-paper-surface2"
                      />
                      <button
                        type="button"
                        aria-label="Delete vault"
                        onClick={() =>
                          onChange((m) => ({ ...m, vaults: m.vaults.filter((v) => v.id !== vault.id) }))
                        }
                        className="pl-1 text-paper-faint"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {hasGoal && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
                      <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Debt Snowball
          </p>
          <button
            type="button"
            onClick={addDebt}
            className="rounded-full bg-work px-3 py-1 text-xs font-medium text-paper-surface"
          >
            + Add Debt
          </button>
        </div>
        <p className="mb-3 text-[11px] italic text-paper-muted">
          For interest rate, minimum, due date, and status, see the Debts tab.
        </p>

        {money.debts.length === 0 ? (
          <p className="py-2 text-center text-xs italic text-paper-muted">No debts tracked - nicely done.</p>
        ) : (
          <>
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[12px] text-paper-muted">
                <span>Total paid off</span>
                <span className="font-medium text-paper-ink">
                  {formatMoney(totalPaid)} of {formatMoney(totalStarting)} ({totalPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-paper-surface2">
                <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${totalPct}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {sortedDebts.map((debt) => {
                const paid = Math.max(0, debt.startingBalance - debt.currentBalance);
                const pct = debt.startingBalance > 0 ? Math.min(100, (paid / debt.startingBalance) * 100) : 0;
                const paidOff = debt.startingBalance > 0 && debt.currentBalance <= 0;
                return (
                  <div key={debt.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <input
                          value={debt.name}
                          onChange={(e) =>
                            onChange((m) => ({
                              ...m,
                              debts: m.debts.map((d) =>
                                d.id === debt.id ? { ...d, name: e.target.value } : d
                              ),
                            }))
                          }
                          className="min-w-0 flex-1 bg-transparent text-[14px] text-paper-ink outline-none"
                        />
                        {paidOff && <span aria-label="Paid off">🎉</span>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[13px] text-paper-muted">
                        <InlineAmount
                          value={debt.currentBalance}
                          onChange={(n) =>
                            onChange((m) => ({
                              ...m,
                              debts: m.debts.map((d) =>
                                d.id === debt.id ? { ...d, currentBalance: n } : d
                              ),
                            }))
                          }
                        />
                        <span>of</span>
                        <InlineAmount
                          value={debt.startingBalance}
                          onChange={(n) =>
                            onChange((m) => ({
                              ...m,
                              debts: m.debts.map((d) =>
                                d.id === debt.id ? { ...d, startingBalance: n } : d
                              ),
                            }))
                          }
                        />
                        <button
                          type="button"
                          aria-label="Delete debt"
                          onClick={() =>
                            onChange((m) => ({ ...m, debts: m.debts.filter((d) => d.id !== debt.id) }))
                          }
                          className="pl-1 text-paper-faint"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
                      <div
                        className="h-full rounded-full bg-work transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
