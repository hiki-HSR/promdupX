import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { computeSimilarity } from "@/lib/similarity";

export const runtime = "edge";

const SIMILARITY_THRESHOLD = 0.8;

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA * magB === 0 ? 0 : dotProduct / (magA * magB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, team, owner } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid content provided" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Fetch all existing prompts to build the corpus
    const { data: existingPrompts, error: fetchError } = await supabase
      .from("prompts")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(20); // Performance: Limit check to recent 20 prompts

    if (fetchError) {
      console.error("Error fetching prompts:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 2. Compute similarity using OpenAI Embeddings
    let maxScore = 0;

    const corpus = existingPrompts?.map((p) => p.content) || [];

    if (process.env.OPENAI_API_KEY && existingPrompts && existingPrompts.length > 0) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const inputResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: content,
        });
        const inputVector = inputResponse.data[0].embedding;

        const corpusResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: corpus,
        });

        for (const item of corpusResponse.data) {
          const score = cosineSimilarity(inputVector, item.embedding);
          if (score > maxScore) maxScore = score;
        }
      } catch (error) {
        console.warn("OpenAI API failed, falling back to local algorithm:", error);
        // Fallback logic below
      }
    }

    // Fallback if maxScore is still 0 (API failed or key missing) but we have prompts
    if (maxScore === 0 && corpus.length > 0) {
      const localResults = computeSimilarity(content, corpus);
      if (localResults.length > 0) {
        maxScore = localResults[0].score;
      }
    }

    // 3. Check threshold
    if (maxScore >= SIMILARITY_THRESHOLD) {
      return NextResponse.json({
        saved: false,
        warning: true,
        maxScore,
      });
    }

    // 4. Save prompt if duplication risk is low
    const { error: insertError } = await supabase
      .from("prompts")
      .insert([{ content, team, owner }]);

    if (insertError) {
      console.error("Error saving prompt:", insertError);
      return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
    }

    return NextResponse.json({ saved: true, warning: false });
  } catch (error) {
    console.error("Error in prompt submission:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}