import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toolDefinitionsForApi } from "@/lib/assistant-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5";

// Anthropic content blocks (text / tool_use / tool_result) - validated
// loosely since the exact shape varies by block type and the API itself
// is the source of truth for what's well-formed.
const contentBlockSchema = z.record(z.any());

const requestSchema = z.object({
  // Cher's system prompt now covers the full app (routines, habits, glow
  // up, knowledge, rhythm, budgeting, meal prep) plus her live memory
  // context, so the old 12000 cap left no headroom once real facts/
  // summaries/at-risk habits are in play - raised with real margin.
  system: z.string().max(24000).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([z.string().max(8000), z.array(contentBlockSchema).max(30)]),
      })
    )
    .min(1)
    .max(120),
  useTools: z.boolean().optional(),
  monthSpendUsd: z.number().optional(),
  monthCapUsd: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "The Assistant isn't set up yet - ANTHROPIC_API_KEY is missing from the environment." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { monthSpendUsd, monthCapUsd } = parsed.data;
  if (monthCapUsd !== null && monthCapUsd !== undefined && (monthSpendUsd ?? 0) >= monthCapUsd) {
    return NextResponse.json(
      {
        ok: false,
        error: `You've hit your monthly Assistant budget of $${monthCapUsd.toFixed(2)} - she'll be back next month, or raise the cap in Settings.`,
      },
      { status: 402 }
    );
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        // Messy multi-part requests ("plan tomorrow, pay the aunt, meal
        // prep for two, what's my budget") can legitimately need 8-10+
        // tool calls in one turn - 2048 was tight enough to truncate mid-
        // response and leave the UI stuck with nothing to show.
        max_tokens: 4096,
        system: parsed.data.system ?? "",
        messages: parsed.data.messages,
        ...(parsed.data.useTools !== false ? { tools: toolDefinitionsForApi() } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Assistant request failed (${res.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      content: Array.isArray(data?.content) ? data.content : [],
      stopReason: data?.stop_reason ?? null,
      usage: {
        inputTokens: data?.usage?.input_tokens ?? 0,
        outputTokens: data?.usage?.output_tokens ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Assistant request failed" },
      { status: 500 }
    );
  }
}
