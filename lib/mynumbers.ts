import { DashboardData } from "./types";
import { daysBetween } from "./date";

// Nothing here is persisted separately - every number is computed live
// from real records (Waiting On, meetings, tasks) each time the screen
// opens, so it can never drift from what actually happened.

export type MyNumbers = {
  waitingOnResolvedCount: number;
  avgResolutionDays: number | null;
  fastestResolutionDays: number | null;
  slowestResolutionDays: number | null;
  meetingsWithAgenda: number;
  agendaCompletionPct: number | null;
  totalTasks: number;
  completedTasks: number;
  taskCompletionPct: number | null;
};

export function computeMyNumbers(data: DashboardData): MyNumbers {
  const resolved = data.waitingOn.items.filter((i) => i.resolvedDate);
  const resolutionDays = resolved.map((i) => daysBetween(i.askedDate, i.resolvedDate));
  const avgResolutionDays =
    resolutionDays.length > 0
      ? Math.round((resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length) * 10) / 10
      : null;
  const fastestResolutionDays = resolutionDays.length > 0 ? Math.min(...resolutionDays) : null;
  const slowestResolutionDays = resolutionDays.length > 0 ? Math.max(...resolutionDays) : null;

  const meetingsWithAgenda = data.meetingOps.meetings.filter((m) => m.agenda.length > 0);
  const totalAgendaItems = meetingsWithAgenda.reduce((sum, m) => sum + m.agenda.length, 0);
  const doneAgendaItems = meetingsWithAgenda.reduce(
    (sum, m) => sum + m.agenda.filter((a) => a.done).length,
    0
  );
  const agendaCompletionPct =
    totalAgendaItems > 0 ? Math.round((doneAgendaItems / totalAgendaItems) * 100) : null;

  const totalTasks = data.workOps.tasks.length;
  const completedTasks = data.workOps.tasks.filter((t) => t.status === "completed").length;
  const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

  return {
    waitingOnResolvedCount: resolved.length,
    avgResolutionDays,
    fastestResolutionDays,
    slowestResolutionDays,
    meetingsWithAgenda: meetingsWithAgenda.length,
    agendaCompletionPct,
    totalTasks,
    completedTasks,
    taskCompletionPct,
  };
}
