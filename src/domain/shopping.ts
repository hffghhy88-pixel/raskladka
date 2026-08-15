import type { Dish, Menu, Product, ShoppingItem, ShoppingList, StockItem } from "../types/models";
import { calcDish, findDish, findProduct } from "./calc";
import { PRODUCT_CATEGORY_LABEL } from "./labels";
import { prettyQty } from "./units";

export function shoppingFromMenu(
  menu: Menu,
  dishes: Dish[],
  products: Product[],
  stock: StockItem[],
): ShoppingList {
  const stockMap = new Map(stock.map((item) => [item.productId, Math.max(0, item.quantityG - item.reservedG)]));
  const acc = new Map<
    string,
    {
      item: Omit<ShoppingItem, "displayQty" | "displayUnit" | "displayLabel" | "inStockG" | "toBuyG">;
    }
  >();

  for (const day of menu.days) {
    for (const slot of day.slots) {
      const dish = findDish(dishes, slot.dishId);
      const calc = calcDish(dish, products, slot.portions);
      for (const line of calc.lines) {
        const origin = dish.lines.find((l) => l.id === line.lineId);
        if (origin?.excludeFromShopping) continue;
        const product = findProduct(products, line.productId);
        const mark = `${day.dateLabel} · ${dish.name}`;
        const current = acc.get(line.productId);
        if (!current) {
          acc.set(line.productId, {
            item: {
              productId: product.id,
              productName: product.name,
              category: product.category,
              grossG: line.weights.grossG,
              netG: line.weights.netG,
              yieldG: line.weights.yieldG,
              cost: line.cost,
              defaultUnit: product.defaultUnit,
              usedIn: [mark],
            },
          });
        } else {
          current.item.grossG += line.weights.grossG;
          current.item.netG += line.weights.netG;
          current.item.yieldG += line.weights.yieldG;
          current.item.cost += line.cost;
          if (!current.item.usedIn.includes(mark)) current.item.usedIn.push(mark);
        }
      }
    }
  }

  const items: ShoppingItem[] = [...acc.values()].map(({ item }) => {
    const product = findProduct(products, item.productId);
    const pretty = prettyQty(item.grossG, product.defaultUnit, {
      densityGPerMl: product.densityGPerMl,
      pieceWeightG: product.pieceWeightG,
    });
    const inStockG = stockMap.get(item.productId) ?? 0;
    return {
      ...item,
      displayQty: pretty.qty,
      displayUnit: pretty.unit,
      displayLabel: pretty.label,
      inStockG,
      toBuyG: Math.max(0, item.grossG - inStockG),
    };
  });

  items.sort((a, b) => a.category.localeCompare(b.category) || a.productName.localeCompare(b.productName, "ru"));

  const catMap = new Map<string, { category: ShoppingItem["category"]; grossG: number; cost: number; count: number }>();
  for (const item of items) {
    const entry = catMap.get(item.category) ?? {
      category: item.category,
      grossG: 0,
      cost: 0,
      count: 0,
    };
    entry.grossG += item.grossG;
    entry.cost += item.cost;
    entry.count += 1;
    catMap.set(item.category, entry);
  }

  return {
    items,
    totalGrossG: items.reduce((s, i) => s + i.grossG, 0),
    totalCost: items.reduce((s, i) => s + i.cost, 0),
    categories: [...catMap.values()].map((c) => ({
      ...c,
      label: PRODUCT_CATEGORY_LABEL[c.category],
    })),
  };
}
