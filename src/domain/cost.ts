import type { CostCard, CostSettings, Dish, DishCalc, Product } from "../types/models";
import { calcDish } from "./calc";

export const DEFAULT_COST: CostSettings = {
  markupPercent: 250,
  overheadPercent: 15,
  vatPercent: 0,
};

export function costCardFromCalc(calc: DishCalc, products: Product[], settings: CostSettings): CostCard {
  const food = Math.max(0, calc.costTotal);
  const lines = calc.lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return {
        productName: line.productName,
        grossG: line.weights.grossG,
        pricePerKg: product?.pricePerKg ?? 0,
        cost: line.cost,
        sharePercent: food > 0 ? (line.cost / food) * 100 : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);

  const withOverhead = food * (1 + settings.overheadPercent / 100);
  const priceEx = withOverhead * (1 + settings.markupPercent / 100);
  const priceInc = priceEx * (1 + settings.vatPercent / 100);
  const per = calc.portions > 0 ? calc.portions : 1;

  return {
    dishName: calc.dishName,
    portions: calc.portions,
    lines,
    foodCost: food,
    markupPercent: settings.markupPercent,
    overheadPercent: settings.overheadPercent,
    vatPercent: settings.vatPercent,
    foodCostPerPortion: food / per,
    priceExVat: priceEx / per,
    priceIncVat: priceInc / per,
    margin: (priceEx - food) / per,
    foodCostRatio: priceEx > 0 ? (food / priceEx) * 100 : 0,
  };
}

export function makeCostCard(
  dish: Dish,
  products: Product[],
  portions: number,
  settings: CostSettings,
): CostCard {
  return costCardFromCalc(calcDish(dish, products, portions), products, settings);
}
