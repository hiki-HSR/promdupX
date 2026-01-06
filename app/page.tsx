"use client";

import { useState } from "react";
import PromptForm from "@/components/PromptForm";
import SimilarityWarning from "@/components/SimilarityWarning";

export default function Home() {
  const [result, setResult] = useState<{
    maxScore: number;
    warning: boolean;
    results: { prompt: string; score: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (prompt: string) => {
    setLoading(true);
    try {
      // Mock database of existing prompts for demonstration
      const mockExistingPrompts = [
        "Explain the significance of the industrial revolution.",
        "Write a poem about artificial intelligence in the style of Shakespeare.",
        "Summarize the main themes of To Kill a Mockingbird.",
        "Create a javascript function to sort an array of objects.",
      ];

      const response = await fetch("/api/similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPrompt: prompt,
          existingPrompts: mockExistingPrompts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking similarity:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-zinc-50 dark:bg-black">
      <div className="z-10 w-full max-w-3xl items-center justify-between font-sans">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            AI Prompt Duplication Checker
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Verify the originality of your AI prompts against our academic submission database to ensure integrity.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <PromptForm onSubmit={handleCheck} isLoading={loading} />

          {result && (
            <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
              <SimilarityWarning
                maxScore={result.maxScore}
                warning={result.warning}
                results={result.results}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
