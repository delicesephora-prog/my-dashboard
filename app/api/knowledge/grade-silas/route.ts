import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAnthropic, parseJsonReply } from "@/lib/anthropic-fetch";
import { buildGradeSilasPrompt } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockSchema = z.object({
  id: z.string(),
  heading: z.string().max(200),
  realWords: z.string().max(4000),
  plainEnglish: z.string().max(4000),
});

const requestSchema = z.object({
  subject: z.object({ name: z.string().max(200), pitch: z.string().max(2000), blocks: z.array(blockSchema).max(40) }),
  response: z.string().min(1).max(8000),
});

const replyShapeSchema = z.object({
  score: z.number().min(0).max(100),
  nailed: z.array(z.string()).max(20),
  missed: z.array(z.string()).max(20),
  modelAnswer: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const prompt = buildGradeSilasPrompt(parsed.data.subject, parsed.data.response);
  const result = await callAnthropic({ system: "", messages: [{ role: "user", content: prompt }], maxTokens: 1536 });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  let json: unknown;
  try {
    json = parseJsonReply(result.content);
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Couldn't parse the reply." }, { status: 502 });
  }

  const validated = replyShapeSchema.safeParse(json);
  if (!validated.success) {
    return NextResponse.json({ ok: false, error: "The model's reply didn't match the expected shape - try again?" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, ...validated.data });
}
