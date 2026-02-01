/**
 * Strips markdown code block formatting from LLM responses.
 * LLMs often wrap JSON in ```json ... ``` blocks.
 */
export function stripMarkdownJson(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}
