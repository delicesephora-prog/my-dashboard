"use client";

import { useState } from "react";
import { ACCOUNT_TYPE_LABELS, Account, AccountType, formatMoney, totalBalance } from "@/lib/finance";

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "credit", "cash", "other"];

export default function AccountsTab({
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: {
  accounts: Account[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (a: Account) => Account) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Total Balance
        </p>
        <p className="mt-0.5 font-serif text-2xl text-paper-ink">{formatMoney(totalBalance(accounts))}</p>
      </div>

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No accounts yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              onUpdate={(u) => onUpdate(a.id, u)}
              onDelete={() => onDelete(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountRow({
  account,
  onUpdate,
  onDelete,
}: {
  account: Account;
  onUpdate: (updater: (a: Account) => Account) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-paper-ink">{account.name || "Unnamed account"}</p>
          <p className="truncate text-[11px] text-paper-muted">{ACCOUNT_TYPE_LABELS[account.type]}</p>
        </div>
        <span className="shrink-0 text-[14px] text-paper-ink">{formatMoney(account.balance)}</span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Name" value={account.name} onChange={(v) => onUpdate((a) => ({ ...a, name: v }))} />
          <div className="flex gap-2.5">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Type
              </p>
              <select
                value={account.type}
                onChange={(e) => onUpdate((a) => ({ ...a, type: e.target.value as AccountType }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Balance
              </p>
              <input
                type="number"
                step="0.01"
                value={account.balance}
                onChange={(e) => onUpdate((a) => ({ ...a, balance: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
      />
    </div>
  );
}
