"use client";

import { useState } from "react";
import { StudySite, SITE_STATUSES } from "@/lib/types";

const STATUS_DOT: Record<string, string> = {
  Active: "#8FA37E",
  Pending: "#C7A46B",
  Closed: "#948A79",
};

export default function SitesSection({
  sites,
  onAdd,
  onUpdate,
  onArchive,
}: {
  sites: StudySite[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (s: StudySite) => StudySite) => void;
  onArchive: (id: string, archived: boolean) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const active = sites.filter((s) => !s.archived);
  const archived = sites.filter((s) => s.archived);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Sites
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3 py-1 text-xs font-medium text-paper-surface"
        >
          + Add Site
        </button>
      </div>

      {active.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No sites yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((site) => (
            <SiteRow
              key={site.id}
              site={site}
              onUpdate={(u) => onUpdate(site.id, u)}
              onArchive={() => onArchive(site.id, true)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-3 border-t border-paper-border pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-paper-muted underline underline-offset-2"
          >
            {showArchived ? "Hide" : "Show"} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="mt-2 flex flex-col gap-2">
              {archived.map((site) => (
                <SiteRow
                  key={site.id}
                  site={site}
                  onUpdate={(u) => onUpdate(site.id, u)}
                  onArchive={() => onArchive(site.id, false)}
                  archivedView
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SiteRow({
  site,
  onUpdate,
  onArchive,
  archivedView,
}: {
  site: StudySite;
  onUpdate: (updater: (s: StudySite) => StudySite) => void;
  onArchive: () => void;
  archivedView?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: STATUS_DOT[site.status] }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-[14px] text-paper-ink">
          {site.name || "Untitled site"}
        </span>
        <span className="shrink-0 text-[11px] text-paper-muted">{site.country}</span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3 py-3">
          <LabeledInput
            label="Site Name"
            value={site.name}
            onChange={(v) => onUpdate((s) => ({ ...s, name: v }))}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Status
              </p>
              <select
                value={site.status}
                onChange={(e) =>
                  onUpdate((s) => ({ ...s, status: e.target.value as StudySite["status"] }))
                }
                className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {SITE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <LabeledInput
                label="Country"
                value={site.country}
                onChange={(v) => onUpdate((s) => ({ ...s, country: v }))}
              />
            </div>
          </div>
          <LabeledInput
            label="Site Manager"
            value={site.siteManager}
            onChange={(v) => onUpdate((s) => ({ ...s, siteManager: v }))}
          />
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Enrollment Count
            </p>
            <input
              type="number"
              min={0}
              value={site.enrollmentCount}
              onChange={(e) =>
                onUpdate((s) => ({ ...s, enrollmentCount: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={site.notes}
              onChange={(e) => onUpdate((s) => ({ ...s, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onArchive}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            {archivedView ? "Unarchive" : "Archive"} this site
          </button>
        </div>
      )}
    </div>
  );
}

function LabeledInput({
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
        className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
      />
    </div>
  );
}
