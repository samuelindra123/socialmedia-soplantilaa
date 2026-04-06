export const MAX_CONTENT_WORDS = 10_000;

export function countWords(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const normalized = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}
