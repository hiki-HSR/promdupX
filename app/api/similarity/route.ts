import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { computeSimilarity } from "@/lib/similarity";

export const runtime = "edge";

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA * magB === 0 ? 0 : dotProduct / (magA * magB);
}

function getLevenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1.0 : 0.0;
  if (b.length === 0) return 0.0;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = matrix[b.length][a.length];
  return 1.0 - (distance / Math.max(a.length, b.length));
}

export async function POST(req: Request) {
  try {
    const { newPrompt } = await req.json();

    if (!newPrompt) {
      return NextResponse.json({ error: "New prompt is required" }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch real prompts from Supabase
    const { data: promptsData } = await supabase
      .from("prompts")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(50); // Check against recent 50 prompts

    const existingPrompts = promptsData?.map((p) => p.content) || [];

    let results: { prompt: string; score: number }[] = [];

    // Try OpenAI if key exists
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const inputResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: newPrompt,
        });
        const inputVector = inputResponse.data[0].embedding;

        const corpusResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: existingPrompts,
        });

        results = corpusResponse.data.map((item, index) => ({
          prompt: existingPrompts[index],
          score: cosineSimilarity(inputVector, item.embedding),
        }));
      } catch (error) {
        console.warn("OpenAI API failed (Quota/Error), falling back to local algorithm:", error);
      }
    }

    // Fallback to TF-IDF if OpenAI failed or key missing
    if (results.length === 0) {
      const localResults = computeSimilarity(newPrompt, existingPrompts);
      results = localResults.map((r) => ({ prompt: r.text, score: r.score }));
    }

    // Enhance scores with Levenshtein distance to catch typos/edits in short text
    results = results.map((item) => {
      const levScore = getLevenshteinSimilarity(newPrompt, item.prompt);
      return { ...item, score: Math.max(item.score, levScore) };
    });

    const maxScore = results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0;

    return NextResponse.json({
      maxScore,
      warning: maxScore > 0.75,
      results,
    });
  } catch (error) {
    console.error("Similarity check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check similarity" },
      { status: 500 }
    );
  }
}