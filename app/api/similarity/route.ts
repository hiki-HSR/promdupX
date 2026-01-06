import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { newPrompt, existingPrompts } = await req.json();

  // 임시: 문자열 길이 기반 (→ 나중에 TF-IDF)
  const results = existingPrompts.map((p: string) => ({
    prompt: p,
    score: Math.random(), // TODO: cosine similarity
  }));

  const maxScore = Math.max(...results.map(r => r.score));

  return NextResponse.json({
    maxScore,
    warning: maxScore > 0.75,
    results,
  });
}