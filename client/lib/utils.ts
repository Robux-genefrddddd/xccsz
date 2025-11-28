import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateConversationTitle(text: string): string {
  // Remove emojis and extra whitespace
  let cleaned = text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .trim();

  // Limit to 50 characters
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50).trim();
  }

  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.!?,;:—-]+$/, "").trim();

  // If still empty or too short, use fallback
  if (cleaned.length < 3) {
    return "Nouvelle conversation";
  }

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
