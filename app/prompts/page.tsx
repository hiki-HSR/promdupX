import { supabase } from "@/lib/db";
import PromptList from "@/components/PromptList";
import type { Prompt } from "@/types/prompt";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const { data: prompts, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching prompts:", error);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-red-500">Unable to load prompts at this time.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-zinc-50 dark:bg-black">
      <div className="z-10 w-full max-w-3xl font-sans">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            Submitted Prompts
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Review the repository of AI prompts submitted for academic integrity checks.
          </p>
        </div>

        {prompts && prompts.length > 0 ? (
          <PromptList prompts={prompts as Prompt[]} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              No prompts submitted yet.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
