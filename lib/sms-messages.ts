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

// A warm, no-guilt evening check-in - returns null (send nothing) when
// she's already on track. Silence is the reward.
export function buildEveningNudge({
  routinePct,
  nightRemaining,
  atRiskHabits,
}: {
  routinePct: number | null;
  nightRemaining: number;
  atRiskHabits: { label: string; doneCount: number; weeklyGoal: number }[];
}): string | null {
  const routineBehind = routinePct !== null && routinePct < 50;

  if (routineBehind && nightRemaining > 0) {
    return `Your night routine is still open. ${nightRemaining} step${
      nightRemaining === 1 ? "" : "s"
    } left - a few minutes keeps the streak. — Your Dashboard`;
  }
  if (atRiskHabits.length > 0) {
    const h = atRiskHabits[0];
    return `${h.label} is close to slipping - ${h.doneCount}/${h.weeklyGoal} this week. A little now keeps it alive. — Your Dashboard`;
  }
  if (routineBehind) {
    return "Today's routines are under halfway done. A few minutes tonight keeps things on track. — Your Dashboard";
  }
  return null;
}
