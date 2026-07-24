import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAnthropic, parseJsonReply } from "@/lib/anthropic-fetch";
import { buildAddSubjectPrompt } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().min(1).max(20000),
});

const replyShapeSchema = z.object({
  pitch: z.string(),
  blocks: z
    .array(z.object({ heading: z.string(), realWords: z.string(), plainEnglish: z.string() }))
    .min(1)
    .max(40),
  cards: z
    .array(
      z.object({
        type: z.enum(["multiple_choice", "fill_blank", "true_false", "explain"]),
        prompt: z.string(),
        answer: z.string(),
        choices: z.array(z.string()).optional(),
      })
    )
    .min(1)
    .max(60),
  questions: z
    .array(
      z.object({
        question: z.string(),
        angle: z.enum(["clinical", "commercial", "trial", "competitive"]),
        whyGood: z.string(),
        whatYoullLearn: z.string(),
      })
    )
    .max(20),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const prompt = buildAddSubjectPrompt(parsed.data.name, parsed.data.notes);
  const result = await callAnthropic({ system: "", messages: [{ role: "user", content: prompt }], maxTokens: 4096 });
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
