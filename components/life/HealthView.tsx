"use client";

import { useState } from "react";
import { Appointment, HealthData, HealthNote, Medication } from "@/lib/health";
import { MealEntry, MealPlanData, addMeal, deleteMeal, updateMeal } from "@/lib/mealplan";
import { RecipeBankData } from "@/lib/recipes";
import { todayKey } from "@/lib/date";
import AppointmentsTab from "./health/AppointmentsTab";
import MedicationsTab from "./health/MedicationsTab";
import NotesTab from "./health/NotesTab";
import MealsTab from "./health/MealsTab";

type Tab = "appointments" | "medications" | "notes" | "meals";

const TABS: { key: Tab; label: string }[] = [
  { key: "appointments", label: "Appointments" },
  { key: "medications", label: "Medications" },
  { key: "notes", label: "Notes" },
  { key: "meals", label: "Meals" },
];

export default function HealthView({
  health,
  onChange,
  mealPlan,
  onChangeMealPlan,
  recipes,
}: {
  health: HealthData;
  onChange: (updater: (h: HealthData) => HealthData) => void;
  mealPlan: MealPlanData;
  onChangeMealPlan: (updater: (m: MealPlanData) => MealPlanData) => void;
  recipes: RecipeBankData;
}) {
  const [tab, setTab] = useState<Tab>("appointments");

  function addAppointment() {
    const appt: Appointment = {
      id: crypto.randomUUID(),
      provider: "",
      specialty: "",
      date: todayKey(),
      time: "",
      location: "",
      notes: "",
    };
    onChange((h) => ({ ...h, appointments: [appt, ...h.appointments] }));
  }

  function addMedication() {
    const med: Medication = {
      id: crypto.randomUUID(),
      name: "",
      dosage: "",
      frequency: "",
      active: true,
      notes: "",
    };
    onChange((h) => ({ ...h, medications: [med, ...h.medications] }));
  }

  function addNote() {
    const note: HealthNote = {
      id: crypto.randomUUID(),
      date: todayKey(),
      text: "",
    };
    onChange((h) => ({ ...h, notes: [note, ...h.notes] }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-life text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appointments" && (
        <AppointmentsTab
          appointments={health.appointments}
          onAdd={addAppointment}
          onUpdate={(id, updater) =>
            onChange((h) => ({
              ...h,
              appointments: h.appointments.map((a) => (a.id === id ? updater(a) : a)),
            }))
          }
          onDelete={(id) =>
            onChange((h) => ({ ...h, appointments: h.appointments.filter((a) => a.id !== id) }))
          }
        />
      )}

      {tab === "medications" && (
        <MedicationsTab
          medications={health.medications}
          onAdd={addMedication}
          onUpdate={(id, updater) =>
            onChange((h) => ({
              ...h,
              medications: h.medications.map((m) => (m.id === id ? updater(m) : m)),
            }))
          }
          onDelete={(id) =>
            onChange((h) => ({ ...h, medications: h.medications.filter((m) => m.id !== id) }))
          }
        />
      )}

      {tab === "notes" && (
        <NotesTab
          notes={health.notes}
          onAdd={addNote}
          onUpdate={(id, updater) =>
            onChange((h) => ({ ...h, notes: h.notes.map((n) => (n.id === id ? updater(n) : n)) }))
          }
          onDelete={(id) => onChange((h) => ({ ...h, notes: h.notes.filter((n) => n.id !== id) }))}
        />
      )}

      {tab === "meals" && (
        <MealsTab
          mealPlan={mealPlan}
          recipes={recipes}
          onAdd={(meal: MealEntry) => onChangeMealPlan((m) => addMeal(m, meal))}
          onUpdate={(id, updater) => onChangeMealPlan((m) => updateMeal(m, id, updater))}
          onDelete={(id) => onChangeMealPlan((m) => deleteMeal(m, id))}
        />
      )}
    </div>
  );
}
