"use client";

import { useState } from "react";
import { SavedIdea, Trip, TripsData, newTrip, pastTrips, upcomingTrips } from "@/lib/trips";
import TripDetail from "./trips/TripDetail";

type Section = "trips" | "ideas";

export default function TripsView({
  trips,
  onChange,
}: {
  trips: TripsData;
  onChange: (updater: (t: TripsData) => TripsData) => void;
}) {
  const [section, setSection] = useState<Section>("trips");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? trips.trips.find((t) => t.id === selectedId) ?? null : null;

  if (selected) {
    return (
      <TripDetail
        trip={selected}
        onChange={onChange}
        onBack={() => setSelectedId(null)}
        onDelete={() => {
          onChange((t) => ({ ...t, trips: t.trips.filter((x) => x.id !== selected.id) }));
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setSection("trips")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            section === "trips"
              ? "bg-life text-paper-surface"
              : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          Trips
        </button>
        <button
          type="button"
          onClick={() => setSection("ideas")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            section === "ideas"
              ? "bg-life text-paper-surface"
              : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          Saved Ideas
        </button>
      </div>

      {section === "trips" ? (
        <TripsList trips={trips.trips} onChange={onChange} onOpen={setSelectedId} />
      ) : (
        <SavedIdeasList savedIdeas={trips.savedIdeas} onChange={onChange} />
      )}
    </div>
  );
}

function TripsList({
  trips,
  onChange,
  onOpen,
}: {
  trips: Trip[];
  onChange: (updater: (t: TripsData) => TripsData) => void;
  onOpen: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [showPast, setShowPast] = useState(false);

  const now = new Date();
  const upcoming = upcomingTrips(trips, now);
  const past = pastTrips(trips, now);

  function addNew() {
    if (!name.trim()) return;
    const trip = newTrip(name.trim(), destination.trim());
    onChange((t) => ({ ...t, trips: [...t.trips, trip] }));
    setName("");
    setDestination("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip name (e.g. Anniversary Getaway)"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-life"
        />
        <div className="flex gap-2">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-life px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Upcoming
        </p>
        {upcoming.length === 0 ? (
          <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No trips planned yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((t) => (
              <TripRow key={t.id} trip={t} onClick={() => onOpen(t.id)} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPast((s) => !s)}
            className="self-start text-[11.5px] text-paper-muted underline decoration-paper-faint underline-offset-2"
          >
            {showPast ? "Hide" : "Show"} past ({past.length})
          </button>
          {showPast && (
            <div className="flex flex-col gap-2">
              {past.map((t) => (
                <TripRow key={t.id} trip={t} onClick={() => onOpen(t.id)} muted />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TripRow({ trip, onClick, muted = false }: { trip: Trip; onClick: () => void; muted?: boolean }) {
  const packed = trip.packingList.filter((i) => i.packed).length;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl2 border border-paper-border bg-paper-surface p-3.5 text-left shadow-paper transition active:scale-[0.98] ${
        muted ? "opacity-70" : ""
      }`}
    >
      <p className="text-[14px] font-semibold text-paper-ink">{trip.name || "Unnamed trip"}</p>
      <p className="mt-0.5 text-[11.5px] text-paper-muted">
        {[
          trip.destination,
          trip.startDate,
          trip.packingList.length > 0 ? `${packed}/${trip.packingList.length} packed` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </button>
  );
}

function SavedIdeasList({
  savedIdeas,
  onChange,
}: {
  savedIdeas: SavedIdea[];
  onChange: (updater: (t: TripsData) => TripsData) => void;
}) {
  const [text, setText] = useState("");

  function addIdea() {
    if (!text.trim()) return;
    const idea: SavedIdea = { id: crypto.randomUUID(), text: text.trim(), link: "", notes: "" };
    onChange((t) => ({ ...t, savedIdeas: [idea, ...t.savedIdeas] }));
    setText("");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-paper-muted">
        Places and trip ideas worth remembering, before they become an actual trip.
      </p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIdea()}
          placeholder="e.g. Portugal in the spring"
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-life"
        />
        <button
          type="button"
          onClick={addIdea}
          className="shrink-0 rounded-lg bg-life px-3 py-2 text-xs font-medium text-paper-surface"
        >
          Add
        </button>
      </div>

      {savedIdeas.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No saved ideas yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {savedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3.5 shadow-paper"
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <input
                  value={idea.text}
                  onChange={(e) =>
                    onChange((t) => ({
                      ...t,
                      savedIdeas: t.savedIdeas.map((i) =>
                        i.id === idea.id ? { ...i, text: e.target.value } : i
                      ),
                    }))
                  }
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-paper-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange((t) => ({ ...t, savedIdeas: t.savedIdeas.filter((i) => i.id !== idea.id) }))
                  }
                  aria-label="Delete idea"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </div>
              <input
                value={idea.link}
                onChange={(e) =>
                  onChange((t) => ({
                    ...t,
                    savedIdeas: t.savedIdeas.map((i) =>
                      i.id === idea.id ? { ...i, link: e.target.value } : i
                    ),
                  }))
                }
                placeholder="Link (optional)"
                className="mb-1.5 w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12px] text-paper-ink outline-none"
              />
              <textarea
                value={idea.notes}
                onChange={(e) =>
                  onChange((t) => ({
                    ...t,
                    savedIdeas: t.savedIdeas.map((i) =>
                      i.id === idea.id ? { ...i, notes: e.target.value } : i
                    ),
                  }))
                }
                placeholder="Notes"
                rows={2}
                className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[12.5px] text-paper-ink outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
