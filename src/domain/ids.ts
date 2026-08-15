export function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function slug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
