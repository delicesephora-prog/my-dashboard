import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAnthropic, parseJsonReply } from "@/lib/anthropic-fetch";
import { buildRefreshQuestionsPrompt } from "@/lib/knowledge";

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
  mastery: z.enum(["novice", "learning", "conversant", "fluent", "expert"]),
});

const replyShapeSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        angle: z.enum(["clinical", "commercial", "trial", "competitive"]),
        whyGood: z.string(),
        whatYoullLearn: z.string(),
      })
    )
    .min(1)
    .max(10),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const prompt = buildRefreshQuestionsPrompt(parsed.data.subject, parsed.data.mastery);
  const result = await callAnthropic({ system: "", messages: [{ role: "user", content: prompt }], maxTokens: 2048 });
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

  return NextResponse.json({ ok: true, questions: validated.data.questions });
}
