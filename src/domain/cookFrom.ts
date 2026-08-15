import type { Dish, Product, StockItem } from "../types/models";
import { calcDish } from "./calc";

export interface CookFromHit {
  dish: Dish;
  maxPortions: number;
  limiting?: { productName: string; haveG: number; needPerPortionG: number };
  missing: string[];
}

export function dishesFromStock(
  dishes: Dish[],
  products: Product[],
  inventory: StockItem[],
): CookFromHit[] {
  const stock = new Map(
    inventory.map((item) => [item.productId, Math.max(0, item.quantityG - item.reservedG)]),
  );
  const hits: CookFromHit[] = [];

  for (const dish of dishes) {
    if (dish.archived || dish.lines.length === 0) continue;
    let calc;
    try {
      calc = calcDish(dish, products, dish.basePortions);
    } catch {
      continue;
    }

    const missing: string[] = [];
    let maxPortions = Number.POSITIVE_INFINITY;
    let limiting: CookFromHit["limiting"];

    for (const line of calc.lines) {
      const origin = dish.lines.find((l) => l.id === line.lineId);
      if (origin?.optional || origin?.excludeFromShopping) continue;
      const needPerPortion = line.weights.grossG / dish.basePortions;
      if (needPerPortion <= 0) continue;
      const have = stock.get(line.productId) ?? 0;
      if (have <= 0) {
        missing.push(line.productName);
        continue;
      }
      const possible = have / needPerPortion;
      if (possible < maxPortions) {
        maxPortions = possible;
        limiting = {
          productName: line.productName,
          haveG: have,
          needPerPortionG: needPerPortion,
        };
      }
    }

    if (!Number.isFinite(maxPortions)) maxPortions = 0;
    if (missing.length > 0) maxPortions = 0;

    hits.push({
      dish,
      maxPortions: Math.floor(maxPortions),
      limiting,
      missing: [...new Set(missing)],
    });
  }

  return hits.sort((a, b) => b.maxPortions - a.maxPortions || a.dish.name.localeCompare(b.dish.name, "ru"));
}
