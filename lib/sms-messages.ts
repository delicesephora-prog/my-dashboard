export function buildOverdueAlert(tasks: { title: string; dueDate: string }[]): string {
  const lines = [`⚠️ ${tasks.length} item${tasks.length === 1 ? "" : "s"} just went overdue:`];
  tasks.forEach((t) => {
    lines.push(`• ${t.title}${t.dueDate ? ` (was due ${t.dueDate})` : ""}`);
  });
  return lines.join("\n");
}

// Morning text - day type, One Thing if set, today's rhythm anchors.
// Short, warm, direct. No calendar line - there's no calendar integration.
export function buildMorningRhythmText({
  dayLabel,
  dayType,
  oneThing,
  anchors,
}: {
  dayLabel: string;
  dayType: string;
  oneThing: string;
  anchors: string[];
}): string {
  const lines = [`Morning. ${dayLabel} - ${dayType} day.`];
  if (oneThing) lines.push(`One Thing: ${oneThing}`);
  if (anchors.length > 0) lines.push(`Today: ${anchors.join(", ")}`);
  lines.push("Make it count.");
  return lines.join("\n");
}

// A single, one-time nudge for a time-sensitive rhythm anchor.
export function buildAnchorNudgeText(anchorText: string): string {
  return `${anchorText} — coming up. Don't let it slide.`;
}

// Sent at 9pm only if the night routine hasn't been started at all -
// direct and honest, grounded in the actual tracked step count, not guilt.
export function buildNightRoutineText(totalSteps: number): string {
  return `It's 9pm and the night routine hasn't been started - ${totalSteps} step${
    totalSteps === 1 ? "" : "s"
  } waiting. A few minutes now. Go.`;
}
