import type { StockItem, Workspace } from "../types/models";
import { DEFAULT_COST } from "../domain/cost";
import { activeSeedDishes } from "./dishes";
import { SEED_MENUS } from "./menus";
import { SEED_PRODUCTS } from "./products";

export function seedInventory(): StockItem[] {
  return [
    { productId: "potato", quantityG: 25000, reservedG: 0, minG: 8000, location: "овощная" },
    { productId: "carrot", quantityG: 8000, reservedG: 0, minG: 2000, location: "овощная" },
    { productId: "onion", quantityG: 6000, reservedG: 0, minG: 2000, location: "овощная" },
    { productId: "cabbage", quantityG: 10000, reservedG: 0, minG: 3000, location: "овощная" },
    { productId: "beet", quantityG: 5000, reservedG: 0, minG: 1500, location: "овощная" },
    { productId: "flour", quantityG: 10000, reservedG: 0, minG: 3000, location: "сухой склад" },
    { productId: "rice", quantityG: 4000, reservedG: 0, minG: 1500, location: "сухой склад" },
    { productId: "buckwheat", quantityG: 4000, reservedG: 0, minG: 1500, location: "сухой склад" },
    { productId: "oil-sun", quantityG: 8000, reservedG: 0, minG: 2000, location: "сухой склад" },
    { productId: "salt", quantityG: 3000, reservedG: 0, minG: 500, location: "сухой склад" },
    { productId: "sugar", quantityG: 5000, reservedG: 0, minG: 1000, location: "сухой склад" },
    { productId: "milk", quantityG: 20000, reservedG: 0, minG: 5000, location: "холод" },
    { productId: "egg", quantityG: 3000, reservedG: 0, minG: 1000, location: "холод" },
    { productId: "mince-mix", quantityG: 4000, reservedG: 0, minG: 2000, location: "мороз" },
    { productId: "chicken", quantityG: 6000, reservedG: 0, minG: 2000, location: "мороз" },
  ];
}

export function createSeedWorkspace(): Workspace {
  return {
    title: "Кухня Раскладка",
    products: SEED_PRODUCTS.map((p) => ({ ...p })),
    dishes: activeSeedDishes().map((d) => ({
      ...d,
      lines: d.lines.map((l) => ({ ...l })),
      steps: [...d.steps],
      tags: [...d.tags],
    })),
    menus: SEED_MENUS.map((m) => ({
      ...m,
      days: m.days.map((day) => ({
        ...day,
        slots: day.slots.map((s) => ({ ...s })),
      })),
    })),
    inventory: seedInventory(),
    cost: { ...DEFAULT_COST },
    updatedAt: new Date().toISOString(),
  };
}
