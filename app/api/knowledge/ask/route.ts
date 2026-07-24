import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAnthropic, extractText, extractCitations } from "@/lib/anthropic-fetch";
import { buildAskDeeperSystemPrompt } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockSchema = z.object({
  id: z.string(),
  heading: z.string().max(200),
  realWords: z.string().max(4000),
  plainEnglish: z.string().max(4000),
});

const subjectSchema = z.object({
  name: z.string().max(200),
  pitch: z.string().max(2000),
  blocks: z.array(blockSchema).max(40),
});

const requestSchema = z.object({
  subject: subjectSchema,
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .min(1)
    .max(60),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const system = buildAskDeeperSystemPrompt(parsed.data.subject);
  const result = await callAnthropic({
    system,
    messages: parsed.data.messages,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    maxTokens: 1536,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const text = extractText(result.content);
  if (!text) {
    return NextResponse.json({ ok: false, error: "No response text came back - try again?" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, text, citations: extractCitations(result.content), usage: result.usage });
}
