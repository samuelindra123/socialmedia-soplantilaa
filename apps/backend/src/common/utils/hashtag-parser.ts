export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);

  if (!matches) return [];

  // Remove # and make unique
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);

  if (!matches) return [];

  // Remove @ and make unique
  return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
}
