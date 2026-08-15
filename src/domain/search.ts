import type { Dish, Menu, Product, SearchHit } from "../types/models";

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replaceAll("ё", "е").split(/\s+/).join(" ");
}

function scoreText(query: string, text: string): number {
  const hay = normalize(text);
  if (!hay) return 0;
  if (hay === query) return 100;
  if (hay.startsWith(query)) return 80;
  if (hay.includes(query)) return 50;
  const tokens = query.split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  const matched = tokens.filter((t) => hay.includes(t)).length;
  if (matched === tokens.length) return 35;
  if (matched > 0) return 15;
  return 0;
}

export function searchWorkspace(
  query: string,
  products: Product[],
  dishes: Dish[],
  menus: Menu[],
  limit = 20,
): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const product of products) {
    if (product.archived) continue;
    let score = scoreText(q, product.name);
    if (product.subcategory) score = Math.max(score, Math.floor(scoreText(q, product.subcategory) / 2));
    if (score > 0) {
      hits.push({
        kind: "product",
        id: product.id,
        title: product.name,
        subtitle: product.category,
        score,
      });
    }
  }

  for (const dish of dishes) {
    if (dish.archived) continue;
    let score = scoreText(q, dish.name);
    for (const tag of dish.tags) score = Math.max(score, Math.floor(scoreText(q, tag) / 2));
    if (score > 0) {
      hits.push({
        kind: "dish",
        id: dish.id,
        title: dish.name,
        subtitle: dish.category,
        score,
      });
    }
  }

  for (const menu of menus) {
    if (menu.archived) continue;
    let score = scoreText(q, menu.name);
    if (menu.venue) score = Math.max(score, Math.floor(scoreText(q, menu.venue) / 2));
    if (score > 0) {
      hits.push({
        kind: "menu",
        id: menu.id,
        title: menu.name,
        subtitle: `${menu.days.length} дн.`,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ru")).slice(0, Math.max(1, limit));
}
