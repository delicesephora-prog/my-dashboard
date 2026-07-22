"use client";

import { useState } from "react";
import { PLANNER_COLOR_PALETTE, PlannerCategoryDef, sortedCategories } from "@/lib/planner";

export default function CategoryManagerSheet({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onClose,
}: {
  categories: PlannerCategoryDef[];
  onAdd: (label: string, color: string) => void;
  onUpdate: (id: string, label: string, color: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onClose: () => void;
}) {
  const sorted = sortedCategories(categories);
  const [adding, setAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftColor, setDraftColor] = useState(PLANNER_COLOR_PALETTE[0]);

  function submitAdd() {
    const label = draftLabel.trim();
    if (!label) return;
    onAdd(label, draftColor);
    setDraftLabel("");
    setDraftColor(PLANNER_COLOR_PALETTE[0]);
    setAdding(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="scroll-quiet safe-bottom max-h-[85vh] overflow-y-auto rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-serif text-[1.1rem] text-paper-ink">Categories</p>
        <p className="mb-4 text-[12px] text-paper-muted">
          Add your own, and pick a color for each from the swatches below.
        </p>

        <ul className="flex flex-col gap-1.5">
          {sorted.map((cat, idx) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              onSave={(label, color) => onUpdate(cat.id, label, color)}
              onDelete={sorted.length > 1 ? () => onDelete(cat.id) : undefined}
              onMoveUp={idx > 0 ? () => onReorder(cat.id, -1) : undefined}
              onMoveDown={idx < sorted.length - 1 ? () => onReorder(cat.id, 1) : undefined}
            />
          ))}
        </ul>

        {adding ? (
          <div className="mt-3 flex flex-col gap-2.5 rounded-xl2 border border-paper-border bg-paper-surface2 p-3">
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              placeholder="New category…"
              className="rounded-lg border border-paper-border bg-paper-surface px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
            />
            <ColorSwatchGrid value={draftColor} onChange={setDraftColor} />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraftLabel("");
                }}
                className="text-[12px] text-paper-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAdd}
                className="rounded-full bg-life px-3 py-1 text-[12px] font-medium text-paper-surface"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 w-full rounded-xl border border-life py-2 text-[12.5px] font-medium text-life"
          >
            + Add Category
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-paper-border py-2.5 text-sm font-medium text-paper-muted"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ColorSwatchGrid({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLANNER_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Choose color ${color}`}
          onClick={() => onChange(color)}
          className="h-7 w-7 shrink-0 rounded-full transition"
          style={{
            backgroundColor: color,
            boxShadow: value === color ? "0 0 0 2px #FBF5EA, 0 0 0 4px " + color : undefined,
          }}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  category: PlannerCategoryDef;
  onSave: (label: string, color: string) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [color, setColor] = useState(category.color);

  function save() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSave(trimmed, color);
    setEditing(false);
  }

  return (
    <li className="rounded-xl2 border border-paper-border bg-paper-surface px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => {
            setLabel(category.label);
            setColor(category.color);
            setEditing((v) => !v);
          }}
          className="min-w-0 flex-1 truncate text-left text-[13.5px] text-paper-ink"
        >
          {category.label}
        </button>
        <div className="flex shrink-0 items-center gap-0.5 text-paper-faint">
          {onMoveUp && (
            <button type="button" aria-label="Move up" onClick={onMoveUp} className="px-1 text-[13px]">
              ↑
            </button>
          )}
          {onMoveDown && (
            <button type="button" aria-label="Move down" onClick={onMoveDown} className="px-1 text-[13px]">
              ↓
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-2.5 flex flex-col gap-2.5 border-t border-paper-border pt-2.5">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <ColorSwatchGrid value={color} onChange={setColor} />
          <div className="flex items-center justify-between">
            {onDelete ? (
              <button type="button" onClick={onDelete} className="text-[12px] text-paper-faint underline underline-offset-2">
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-paper-muted">
                Cancel
              </button>
              <button type="button" onClick={save} className="rounded-full bg-life px-3 py-1 text-[12px] font-medium text-paper-surface">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
