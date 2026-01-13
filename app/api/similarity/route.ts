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

    const maxScore = results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0;

    return NextResponse.json({
      maxScore,
      warning: maxScore > 0.8,
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