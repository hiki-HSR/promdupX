"use client";

import { useState } from "react";

export default function PromptForm() {
  const [text, setText] = useState("");
  const [warning, setWarning] = useState(false);

  async function checkSimilarity() {
    const res = await fetch("/api/similarity", {
      method: "POST",
      body: JSON.stringify({
        newPrompt: text,
        existingPrompts: ["Summarize the article"],
      }),
    });

    const data = await res.json();
    setWarning(data.warning);
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border w-full p-2"
      />
      <button onClick={checkSimilarity}>중복 검사</button>
      {warning && <p className="text-red-500">⚠️ 유사 프롬프트 존재</p>}
    </div>
  );
}