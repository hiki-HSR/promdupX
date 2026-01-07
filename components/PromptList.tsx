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
          <div className="mb-4 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
            {prompt.content}
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
