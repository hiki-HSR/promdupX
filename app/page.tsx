"use client";

import Link from "next/link";
import { useState } from "react";
import PromptForm from "@/components/PromptForm";
import SimilarityWarning from "@/components/SimilarityWarning";
import { submitPrompt } from "./actions";

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
      const response = await fetch("/api/similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPrompt: prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);

        // 검사 성공 시 자동으로 Supabase에 저장
        const saveResult = await submitPrompt(prompt, undefined, undefined, data.maxScore);
        if (!saveResult.success) {
          console.error("Auto-save failed:", saveResult.error);

          // 이미 DB에 존재하는 프롬프트라면 화면에도 중복으로 표시
          if (saveResult.error === "이미 제출된 프롬프트입니다.") {
            setResult({
              maxScore: 1.0,
              warning: true,
              results: [{ prompt: "Exact match found in database.", score: 1.0 }],
            });
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server returned error:", response.status, errorData);
        alert(`Failed to check similarity: ${errorData.error || "Check server logs."}`);
      }
    } catch (error) {
      console.error("Error checking similarity:", error);
      alert("An error occurred while checking similarity.");
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
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            Verify the originality of your AI prompts against our academic submission database to ensure integrity.
          </p>
          <Link
            href="/prompts"
            className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-100"
          >
            View Submitted Prompts &rarr;
          </Link>
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
