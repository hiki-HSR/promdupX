import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA * magB === 0 ? 0 : dotProduct / (magA * magB);
}

export async function POST(req: Request) {
  const { newPrompt, existingPrompts } = await req.json();

  if (!newPrompt || !existingPrompts || existingPrompts.length === 0) {
    return NextResponse.json({ maxScore: 0, warning: false, results: [] });
  }

  // Generate embeddings for input and corpus
  const inputResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: newPrompt,
  });
  const inputVector = inputResponse.data[0].embedding;

  const corpusResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: existingPrompts,
  });

  const results = corpusResponse.data.map((item, index) => ({
    prompt: existingPrompts[index],
    score: cosineSimilarity(inputVector, item.embedding),
  }));

  const maxScore = Math.max(...results.map((r) => r.score));

  return NextResponse.json({
    maxScore,
    warning: maxScore > 0.8,
    results,
  });
}