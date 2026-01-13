"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function submitPrompt(content: string, team?: string, owner?: string, similarityScore?: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing.");
    return { success: false, error: "Server configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`[Server] Submitting prompt: ${content.substring(0, 20)}...`);

  // 'prompts' 테이블에 데이터 저장
  const { error } = await supabase
    .from("prompts")
    .insert([{ 
      content,
      team: team || null,
      owner: owner || null,
      similarity_score: similarityScore ?? 0
    }]);

  if (error) {
    console.error("[Server] Error submitting prompt:", error.message);
    // 이미 존재하는 프롬프트일 경우 (Unique constraint violation code: 23505)
    if (error.code === '23505') {
      return { success: false, error: "이미 제출된 프롬프트입니다." };
    }
    return { success: false, error: error.message };
  }

  console.log("[Server] Insert successful");
  // 저장 후 목록 페이지(/prompts)의 캐시를 갱신하여 최신 데이터가 보이게 함
  revalidatePath("/prompts");
  return { success: true };
}