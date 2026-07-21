"use client";

import { useState } from "react";
import {
  ItineraryEvent,
  PackingItem,
  Trip,
  TripBudgetItem,
  TripsData,
  daysUntilTrip,
  packingProgress,
  tripBudgetTotals,
} from "@/lib/trips";
import CheckCircle from "../../CheckCircle";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function TripDetail({
  trip,
  onChange,
  onBack,
  onDelete,
}: {
  trip: Trip;
  onChange: (updater: (t: TripsData) => TripsData) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  function update(updater: (t: Trip) => Trip) {
    onChange((data) => ({ ...data, trips: data.trips.map((t) => (t.id === trip.id ? updater(t) : t)) }));
  }

  const days = daysUntilTrip(trip);
  const packing = packingProgress(trip.packingList);
  const budgetSums = tripBudgetTotals(trip.budget);
  const sortedItinerary = [...trip.itinerary].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  const [newItinDate, setNewItinDate] = useState(trip.startDate ?? "");
  const [newItinTime, setNewItinTime] = useState("");
  const [newItinText, setNewItinText] = useState("");
  const [newPackText, setNewPackText] = useState("");
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetEstimated, setNewBudgetEstimated] = useState("");

  function addItinerary() {
    if (!newItinDate || !newItinText.trim()) return;
    const event: ItineraryEvent = {
      id: crypto.randomUUID(),
      date: newItinDate,
      time: newItinTime,
      text: newItinText.trim(),
    };
    update((t) => ({ ...t, itinerary: [...t.itinerary, event] }));
    setNewItinText("");
  }

  function addPackingItem() {
    if (!newPackText.trim()) return;
    const item: PackingItem = { id: crypto.randomUUID(), text: newPackText.trim(), packed: false };
    update((t) => ({ ...t, packingList: [...t.packingList, item] }));
    setNewPackText("");
  }

  function addBudgetItem() {
    const estimated = Number(newBudgetEstimated);
    if (!newBudgetCategory.trim() || Number.isNaN(estimated)) return;
    const item: TripBudgetItem = {
      id: crypto.randomUUID(),
      category: newBudgetCategory.trim(),
      estimated,
      actual: 0,
    };
    update((t) => ({ ...t, budget: [...t.budget, item] }));
    setNewBudgetCategory("");
    setNewBudgetEstimated("");
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Trips
      </button>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex items-start justify-between gap-2">
          <input
            value={trip.name}
            onChange={(e) => update((t) => ({ ...t, name: e.target.value }))}
            placeholder="Trip name"
            className="min-w-0 flex-1 bg-transparent font-serif text-[1.05rem] text-paper-ink outline-none"
          />
          {days !== null && (
            <span className="shrink-0 rounded-full border border-life/40 px-2 py-0.5 text-[10.5px] text-life">
              {days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`}
            </span>
          )}
        </div>
        <input
          value={trip.destination}
          onChange={(e) => update((t) => ({ ...t, destination: e.target.value }))}
          placeholder="Destination"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Start
            </p>
            <input
              type="date"
              value={trip.startDate ?? ""}
              onChange={(e) => update((t) => ({ ...t, startDate: e.target.value || null }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12.5px] text-paper-ink outline-none"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              End
            </p>
            <input
              type="date"
              value={trip.endDate ?? ""}
              onChange={(e) => update((t) => ({ ...t, endDate: e.target.value || null }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12.5px] text-paper-ink outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Itinerary
        </p>
        {sortedItinerary.length > 0 && (
          <ul className="mb-2 flex flex-col gap-2">
            {sortedItinerary.map((event) => (
              <li key={event.id} className="flex items-start gap-2.5">
                <div className="w-[68px] shrink-0 text-[10.5px] leading-tight text-paper-muted">
                  <div>{event.date.slice(5)}</div>
                  {event.time && <div>{event.time}</div>}
                </div>
                <span className="min-w-0 flex-1 text-[13.5px] text-paper-ink">{event.text}</span>
                <button
                  type="button"
                  onClick={() => update((t) => ({ ...t, itinerary: t.itinerary.filter((e) => e.id !== event.id) }))}
                  aria-label="Delete itinerary event"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="date"
            value={newItinDate}
            onChange={(e) => setNewItinDate(e.target.value)}
            className="w-32 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12px] text-paper-ink outline-none"
          />
          <input
            type="time"
            value={newItinTime}
            onChange={(e) => setNewItinTime(e.target.value)}
            className="w-24 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12px] text-paper-ink outline-none"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newItinText}
            onChange={(e) => setNewItinText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItinerary()}
            placeholder="e.g. Check in at hotel"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addItinerary}
            className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Packing List
          </p>
          {packing.total > 0 && (
            <span className="text-[11px] text-paper-muted">
              {packing.packed}/{packing.total}
            </span>
          )}
        </div>
        {trip.packingList.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {trip.packingList.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <CheckCircle
                  done={item.packed}
                  onToggle={() =>
                    update((t) => ({
                      ...t,
                      packingList: t.packingList.map((i) =>
                        i.id === item.id ? { ...i, packed: !i.packed } : i
                      ),
                    }))
                  }
                  accentClass="bg-life"
                  size="sm"
                  ariaLabel={item.packed ? "Mark not packed" : "Mark packed"}
                />
                <span
                  className={`min-w-0 flex-1 text-[13.5px] ${
                    item.packed ? "text-paper-faint line-through" : "text-paper-ink"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    update((t) => ({ ...t, packingList: t.packingList.filter((i) => i.id !== item.id) }))
                  }
                  aria-label="Delete packing item"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={newPackText}
            onChange={(e) => setNewPackText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPackingItem()}
            placeholder="Add an item…"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addPackingItem}
            className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Budget
        </p>
        {trip.budget.length > 0 && (
          <div className="mb-2 flex flex-col gap-2">
            {trip.budget.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[13px] text-paper-ink">{item.category}</span>
                <input
                  type="number"
                  step="0.01"
                  value={item.estimated}
                  onChange={(e) =>
                    update((t) => ({
                      ...t,
                      budget: t.budget.map((b) =>
                        b.id === item.id ? { ...b, estimated: Number(e.target.value) || 0 } : b
                      ),
                    }))
                  }
                  className="w-20 rounded-lg border border-paper-border bg-paper-surface2 px-1.5 py-1 text-right text-[12px] text-paper-ink outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.actual}
                  onChange={(e) =>
                    update((t) => ({
                      ...t,
                      budget: t.budget.map((b) =>
                        b.id === item.id ? { ...b, actual: Number(e.target.value) || 0 } : b
                      ),
                    }))
                  }
                  className="w-20 rounded-lg border border-paper-border bg-paper-surface2 px-1.5 py-1 text-right text-[12px] text-paper-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => update((t) => ({ ...t, budget: t.budget.filter((b) => b.id !== item.id) }))}
                  aria-label="Delete budget line"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-paper-border pt-1.5 text-[11.5px] text-paper-muted">
              <span>Estimated {formatMoney(budgetSums.estimated)}</span>
              <span>Actual {formatMoney(budgetSums.actual)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newBudgetCategory}
            onChange={(e) => setNewBudgetCategory(e.target.value)}
            placeholder="Category (e.g. Flights)"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <input
            type="number"
            step="0.01"
            value={newBudgetEstimated}
            onChange={(e) => setNewBudgetEstimated(e.target.value)}
            placeholder="Estimated"
            className="w-24 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addBudgetItem}
            className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Notes
        </p>
        <textarea
          value={trip.notes}
          onChange={(e) => update((t) => ({ ...t, notes: e.target.value }))}
          placeholder="Anything else worth remembering"
          rows={3}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-life"
        />
      </div>

      <button type="button" onClick={onDelete} className="self-start text-[11px] text-paper-faint">
        Delete trip
      </button>
    </div>
  );
}
