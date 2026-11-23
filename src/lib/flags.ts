// Derive an ISO 3166-1 alpha-2 code (lowercase) from a flag emoji.
// Flag emoji are two Regional Indicator Symbols (U+1F1E6..U+1F1FF => A..Z).
export function isoFromFlagEmoji(emoji: string | null | undefined): string | null {
  if (!emoji) return null;
  const cps = Array.from(emoji).map((c) => c.codePointAt(0) ?? 0);
  const letters = cps
    .filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)
    .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 0x61));
  if (letters.length === 2) return letters.join("");
  return null;
}
