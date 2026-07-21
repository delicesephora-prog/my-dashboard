import { dateKey } from "./date";

export type Appointment = {
  id: string;
  provider: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  notes: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  active: boolean;
  notes: string;
};

export type HealthNote = {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
};

export type HealthData = {
  appointments: Appointment[];
  medications: Medication[];
  notes: HealthNote[];
};

export function emptyHealthData(): HealthData {
  return { appointments: [], medications: [], notes: [] };
}

export function normalizeHealthData(partial: Partial<HealthData> | null | undefined): HealthData {
  return {
    appointments: partial?.appointments ?? [],
    medications: partial?.medications ?? [],
    notes: partial?.notes ?? [],
  };
}

export function upcomingAppointments(
  appointments: Appointment[],
  now: Date = new Date()
): Appointment[] {
  const today = dateKey(now);
  return appointments.filter((a) => a.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

export function pastAppointments(
  appointments: Appointment[],
  now: Date = new Date()
): Appointment[] {
  const today = dateKey(now);
  return appointments.filter((a) => a.date < today).sort((a, b) => b.date.localeCompare(a.date));
}
