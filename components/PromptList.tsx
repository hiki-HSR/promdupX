import type { Prompt } from "@/types/prompt";

interface PromptListProps {
  prompts: Prompt[];
}

export default function PromptList({ prompts }: PromptListProps) {
  return (
    <div className="w-full space-y-4">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="flex flex-col rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
              {prompt.content}
            </div>
            {typeof prompt.similarity_score === "number" && (
              <div
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                  prompt.similarity_score > 0.75
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                    : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400"
                }`}
              >
                {prompt.similarity_score > 0.75 ? "High Similarity" : "Original"}
                <span className="ml-1 opacity-75">
                  ({(prompt.similarity_score * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex gap-3">
              {prompt.team && (
                <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                  {prompt.team}
                </span>
              )}
              {prompt.owner && <span>{prompt.owner}</span>}
            </div>
            <time dateTime={prompt.created_at}>
              {new Date(prompt.created_at).toLocaleDateString("en-US")}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
