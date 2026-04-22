import type { PromptExecutionType } from "@/lib/types";

export const promptExecutionTypeOptions: PromptExecutionType[] = ["unknown", "agent", "plan", "ask"];

export function getPromptExecutionTypeLabel(value: PromptExecutionType) {
  switch (value) {
    case "agent":
      return "Agent";
    case "plan":
      return "Plan";
    case "ask":
      return "Ask";
    default:
      return "Unknown";
  }
}