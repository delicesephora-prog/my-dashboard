export function buildMorningNudge(
  oneThing: string,
  topPriorities: { title: string }[]
): string {
  const lines = ["Good morning! ☀️"];

  if (oneThing) {
    lines.push(`One Thing: ${oneThing}`);
  }

  if (topPriorities.length > 0) {
    lines.push("Top priorities:");
    topPriorities.forEach((p, i) => lines.push(`${i + 1}. ${p.title}`));
  } else {
    lines.push("No top priorities pinned yet.");
  }

  return lines.join("\n");
}

export function buildOverdueAlert(tasks: { title: string; dueDate: string }[]): string {
  const lines = [`⚠️ ${tasks.length} item${tasks.length === 1 ? "" : "s"} just went overdue:`];
  tasks.forEach((t) => {
    lines.push(`• ${t.title}${t.dueDate ? ` (was due ${t.dueDate})` : ""}`);
  });
  return lines.join("\n");
}
