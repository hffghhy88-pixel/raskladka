import type { Dish, DishCalc, Product, TechCard } from "../types/models";
import { calcDish } from "./calc";
import { COLD_LABEL, DISH_CATEGORY_LABEL, HOT_LABEL } from "./labels";
import { formatNutrition } from "./nutrition";
import { formatMassGrams, formatMoney, formatRu, unitCode } from "./units";

export function renderTechCard(dish: Dish, products: Product[], calc: DishCalc): TechCard {
  const allergens: string[] = [];
  const lines = calc.lines.map((line, index) => {
    const product = products.find((p) => p.id === line.productId);
    for (const allergen of product?.allergens ?? []) {
      if (!allergens.includes(allergen)) allergens.push(allergen);
    }
    return {
      index: index + 1,
      productName: line.productName,
      unit: unitCode(line.unit),
      quantity: formatRu(line.quantity, 2, unitCode(line.unit)),
      grossG: formatMassGrams(line.weights.grossG),
      netG: formatMassGrams(line.weights.netG),
      yieldG: formatMassGrams(line.weights.yieldG),
      cold: COLD_LABEL[line.cold],
      hot: HOT_LABEL[line.hot],
      note: line.note ?? "",
    };
  });

  return {
    title: dish.name,
    dishId: dish.id,
    portions: calc.portions,
    cookTimeMin: dish.cookTimeMin,
    prepTimeMin: dish.prepTimeMin,
    category: DISH_CATEGORY_LABEL[dish.category],
    description: dish.description ?? "",
    lines,
    steps: dish.steps,
    grossTotal: formatMassGrams(calc.totals.grossG),
    netTotal: formatMassGrams(calc.totals.netG),
    yieldTotal: formatMassGrams(calc.totals.yieldG),
    finishedYield: formatMassGrams(calc.finishedYieldG),
    portionYield: formatMassGrams(calc.portionYieldG),
    targetPortion: dish.targetPortionG > 0 ? formatMassGrams(dish.targetPortionG) : "по факту",
    nutritionPerPortion: formatNutrition(calc.nutritionPerPortion),
    costPerPortion: formatMoney(calc.costPerPortion),
    allergens,
    warnings: calc.warnings,
  };
}

export function makeTechCard(dish: Dish, products: Product[], portions: number): TechCard {
  return renderTechCard(dish, products, calcDish(dish, products, portions));
}

export function techCardMarkdown(card: TechCard): string {
  const rows = card.lines
    .map(
      (line) =>
        `| ${line.index} | ${line.productName} | ${line.quantity} | ${line.grossG} | ${line.netG} | ${line.yieldG} | ${line.cold} | ${line.hot} |`,
    )
    .join("\n");
  const steps = card.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
  return `# Технологическая карта

**${card.title}**

Категория: ${card.category} · Порций: ${card.portions} · Подготовка: ${card.prepTimeMin} мин · Приготовление: ${card.cookTimeMin} мин

${card.description}

| № | Продукт | Кол-во | Брутто | Нетто | Выход | Холод. | Тепл. |
|---|---|---:|---:|---:|---:|---|---|
${rows}

**Итого брутто:** ${card.grossTotal} · **нетто:** ${card.netTotal} · **выход сырья:** ${card.yieldTotal} · **выход блюда:** ${card.finishedYield} · **порция:** ${card.portionYield}

Пищевая ценность порции: ${card.nutritionPerPortion} · себестоимость: ${card.costPerPortion}

## Технология

${steps}

Аллергены: ${card.allergens.join(", ") || "не указаны"}
`;
}
