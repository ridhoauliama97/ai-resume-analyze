"use client";

import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildImprovementPrompt } from "@/lib/ai/improvement-prompt";
import type { AnalysisDetail } from "@/lib/db/queries";

export function CopyImprovementPromptButton({
  analysis,
}: {
  analysis: AnalysisDetail;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function onCopy() {
    const prompt = buildImprovementPrompt(analysis);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = prompt;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const label =
    status === "copied"
      ? "Prompt tersalin"
      : status === "error"
        ? "Gagal menyalin"
        : "Copy prompts";

  const icon =
    status === "copied" ? (
      <CheckIcon data-icon="inline-start" aria-hidden="true" />
    ) : status === "error" ? (
      <XIcon data-icon="inline-start" aria-hidden="true" />
    ) : (
      <CopyIcon data-icon="inline-start" aria-hidden="true" />
    );

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      aria-label="Salin prompt perbaikan"
    >
      {icon}
      {label}
    </Button>
  );
}
