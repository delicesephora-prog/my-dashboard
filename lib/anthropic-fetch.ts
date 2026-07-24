// Small shared helper for the Knowledge tab's four AI-backed routes -
// /api/assistant has its own single call site so it inlines this, but
// Knowledge has four near-identical call sites, so it's worth sharing.

const MODEL = "claude-sonnet-5";

export type AnthropicBlock = { type: string; [key: string]: unknown };

export type AnthropicResult =
  | { ok: true; content: AnthropicBlock[]; usage: { inputTokens: number; outputTokens: number } }
  | { ok: false; error: string; status: number };

export async function callAnthropic(options: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  tools?: Record<string, unknown>[];
  maxTokens?: number;
}): Promise<AnthropicResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "The Knowledge tab isn't set up yet - ANTHROPIC_API_KEY is missing from the environment.", status: 503 };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: options.maxTokens ?? 1536,
        system: options.system,
        messages: options.messages,
        ...(options.tools ? { tools: options.tools } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Request failed (${res.status}): ${text.slice(0, 300)}`, status: 502 };
    }
    const data = await res.json();
    return {
      ok: true,
      content: Array.isArray(data?.content) ? data.content : [],
      usage: { inputTokens: data?.usage?.input_tokens ?? 0, outputTokens: data?.usage?.output_tokens ?? 0 },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request failed", status: 500 };
  }
}

export function extractText(content: AnthropicBlock[]): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => String((b as { text?: string }).text ?? ""))
    .join("\n\n")
    .trim();
}

export type Citation = { title: string; url: string };

// Defensive on purpose - the exact citation shape on web-search text
// blocks isn't something to hard-fail on if it drifts; missing/malformed
// citations are just dropped rather than crashing the response.
export function extractCitations(content: AnthropicBlock[]): Citation[] {
  const citations: Citation[] = [];
  for (const block of content) {
    if (block.type !== "text") continue;
    const raw = (block as { citations?: unknown }).citations;
    if (!Array.isArray(raw)) continue;
    for (const c of raw) {
      if (c && typeof c === "object" && "url" in c) {
        const url = String((c as { url?: unknown }).url ?? "");
        const title = String((c as { title?: unknown }).title ?? url);
        if (url) citations.push({ title, url });
      }
    }
  }
  const seen = new Set<string>();
  return citations.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

// Strips a ```json fence if the model wrapped its reply in one despite
// being asked not to, then parses. Throws with a clear message instead of
// returning null, so the caller surfaces a real error rather than a
// silent empty state.
export function parseJsonReply(content: AnthropicBlock[]): unknown {
  const text = extractText(content);
  if (!text) throw new Error("No text came back from the model.");
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    throw new Error("The model's reply wasn't valid JSON.");
  }
}
