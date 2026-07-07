/** Transliterate + slugify (Cyrillic → latin) for SEO-friendly URLs. */
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
  // Tajik-specific
  ғ: 'gh', ӣ: 'i', қ: 'q', ӯ: 'u', ҳ: 'h', ҷ: 'j',
};

export function slugify(input: string): string {
  const lower = (input || '').toLowerCase().trim();
  let out = '';
  for (const ch of lower) out += MAP[ch] ?? ch;
  return out
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

/**
 * Ensure a slug is unique in a table. `exists` checks whether a slug is already
 * taken (excluding the current record when editing).
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  if (!(await exists(root))) return root;
  let i = 2;
  // cap attempts to avoid infinite loops
  while (i < 500) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
    i++;
  }
  return `${root}-${Date.now()}`;
}
