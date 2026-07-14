export type DigestPriority = { title: string; dueDate: string; statusLabel: string };
export type DigestTask = { title: string; dueDate: string };

export type DigestData = {
  name: string;
  dateLabel: string;
  oneThing: string;
  topPriorities: DigestPriority[];
  overdue: DigestTask[];
  waiting: DigestTask[];
  streak: number;
};

const COLORS = {
  bg: "#F6F1E9",
  surface: "#FFFCF6",
  surface2: "#FBF5EA",
  border: "#E7DFCF",
  ink: "#2B2620",
  muted: "#948A79",
  faint: "#C9BEA9",
  work: "#6E5C4B",
  life: "#C1815F",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function section(label: string, bodyHtml: string): string {
  return `
    <tr>
      <td style="padding:0 28px 22px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
          ${label}
        </p>
        ${bodyHtml}
      </td>
    </tr>`;
}

function emptyState(text: string): string {
  return `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:${COLORS.faint};">${escapeHtml(
    text
  )}</p>`;
}

function taskRow(title: string, meta: string, accent: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};">
        <table role="presentation" width="100%">
          <tr>
            <td style="width:8px;padding-right:10px;vertical-align:middle;">
              <div style="width:6px;height:6px;border-radius:50%;background-color:${accent};"></div>
            </td>
            <td style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:${COLORS.ink};vertical-align:middle;">
              ${escapeHtml(title)}
            </td>
            <td style="text-align:right;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;color:${COLORS.muted};white-space:nowrap;vertical-align:middle;">
              ${escapeHtml(meta)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildDigestHtml(data: DigestData): string {
  const oneThingHtml = data.oneThing
    ? `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;color:${COLORS.ink};">${escapeHtml(
        data.oneThing
      )}</p>`
    : emptyState("Nothing set for today yet.");

  const topPrioritiesHtml = data.topPriorities.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;">${data.topPriorities
        .map((p) => taskRow(p.title, [p.statusLabel, p.dueDate].filter(Boolean).join(" · "), COLORS.work))
        .join("")}</table>`
    : emptyState("No top priorities pinned.");

  const overdueHtml = data.overdue.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;">${data.overdue
        .map((t) => taskRow(t.title, t.dueDate, "#B5574A"))
        .join("")}</table>`
    : emptyState("Nothing overdue - nice.");

  const waitingHtml = data.waiting.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;">${data.waiting
        .map((t) => taskRow(t.title, "", "#C7A46B"))
        .join("")}</table>`
    : emptyState("Nothing waiting on anyone else.");

  const streakHtml = `
    <table role="presentation" width="100%" style="background-color:${COLORS.surface2};border-radius:14px;">
      <tr>
        <td style="padding:16px 18px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLORS.ink};">${data.streak}</span>
          <span style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;color:${COLORS.muted};"> day${
    data.streak === 1 ? "" : "s"
  } in a row</span>
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:${COLORS.bg};">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
      <tr>
        <td>
          <table role="presentation" width="100%" style="background-color:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px 24px;">
                <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:23px;color:${COLORS.ink};">Good morning, ${escapeHtml(
    data.name
  )}</p>
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;font-style:italic;color:${COLORS.muted};">${escapeHtml(
    data.dateLabel
  )}</p>
              </td>
            </tr>
            ${section("My One Thing", oneThingHtml)}
            ${section("Top Priorities", topPrioritiesHtml)}
            ${section("Overdue", overdueHtml)}
            ${section("Waiting On", waitingHtml)}
            ${section("Daily Review Streak", streakHtml)}
            <tr>
              <td style="padding:4px 28px 28px;">
                <p style="margin:0;text-align:center;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;color:${COLORS.faint};">
                  Sent from your personal dashboard
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
