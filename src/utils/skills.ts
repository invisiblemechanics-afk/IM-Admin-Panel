export function ensureSkillTags(input?: { skillTags?: string[]; skillTag?: string }) {
  const tags = (input?.skillTags && input.skillTags.length)
    ? input.skillTags
    : (input?.skillTag ? [input.skillTag] : []);
  const primary = tags[0] ?? '';
  return { skillTags: tags, skillTag: primary };
}

// Helper to get display tags from a document with fallback
export function getDisplaySkillTags(doc: { skillTags?: string[]; skillTag?: string }): string[] {
  return doc.skillTags && doc.skillTags.length ? doc.skillTags : (doc.skillTag ? [doc.skillTag] : []);
}
