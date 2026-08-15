import type {
  Dish,
  DishCalc,
  DishLine,
  LineCalc,
  Product,
  WeightTriple,
} from "../types/models";
import { addNutrition, nutritionForGrams, scaleNutrition, zeroNutrition } from "./nutrition";
import { toGrams } from "./units";
import { coldLossPercent, hotYieldPercent } from "./yield";

export function zeroWeights(): WeightTriple {
  return { grossG: 0, netG: 0, yieldG: 0 };
}

export function addWeights(a: WeightTriple, b: WeightTriple): WeightTriple {
  return {
    grossG: a.grossG + b.grossG,
    netG: a.netG + b.netG,
    yieldG: a.yieldG + b.yieldG,
  };
}

export function scaleWeights(w: WeightTriple, factor: number): WeightTriple {
  return { grossG: w.grossG * factor, netG: w.netG * factor, yieldG: w.yieldG * factor };
}

export function findProduct(products: Product[], id: string): Product {
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`продукт не найден: ${id}`);
  return product;
}

export function findDish(dishes: Dish[], id: string): Dish {
  const dish = dishes.find((d) => d.id === id);
  if (!dish) throw new Error(`блюдо не найдено: ${id}`);
  return dish;
}

export function calcLine(line: DishLine, product: Product, scale: number): LineCalc {
  if (!Number.isFinite(line.quantity) || line.quantity < 0) {
    throw new Error(`некорректное количество у ${product.name}`);
  }
  const qty = line.quantity * scale;
  const ctx = {
    densityGPerMl: product.densityGPerMl,
    pieceWeightG: product.pieceWeightG,
  };
  let grossG: number;
  try {
    grossG = toGrams(qty, line.unit, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${product.name}: ${message}`);
  }

  const coldPct = line.coldLossOverride ?? coldLossPercent(product.yieldProfile, line.cold);
  const hotPct = line.hotYieldOverride ?? hotYieldPercent(product.yieldProfile, line.hot);
  const netG = grossG * (1 - coldPct / 100);
  const yieldG = netG * (hotPct / 100);
  const nutrition = nutritionForGrams(product.nutritionPer100g, netG);
  const cost = (grossG / 1000) * product.pricePerKg;

  return {
    lineId: line.id,
    productId: product.id,
    productName: product.name,
    quantity: qty,
    unit: line.unit,
    weights: { grossG, netG, yieldG },
    cold: line.cold,
    hot: line.hot,
    coldLossPercent: coldPct,
    hotYieldPercent: hotPct,
    nutrition,
    cost,
    excludeFromYield: line.excludeFromYield,
    optional: line.optional,
    group: line.group,
    note: line.note,
  };
}

export function calcDish(dish: Dish, products: Product[], portions: number): DishCalc {
  if (!Number.isFinite(portions) || portions <= 0) {
    throw new Error(`некорректное число порций: ${portions}`);
  }
  if (dish.basePortions <= 0) throw new Error("базовое число порций должно быть больше нуля");
  const scale = portions / dish.basePortions;
  const lines: LineCalc[] = [];
  const warnings: string[] = [];
  let totals = zeroWeights();
  let yieldSum = 0;
  let nutritionTotal = zeroNutrition();
  let costTotal = 0;

  for (const line of dish.lines) {
    const product = findProduct(products, line.productId);
    const calc = calcLine(line, product, scale);
    if (!line.excludeFromYield) {
      totals = addWeights(totals, calc.weights);
      yieldSum += calc.weights.yieldG;
    } else {
      totals = {
        grossG: totals.grossG + calc.weights.grossG,
        netG: totals.netG + calc.weights.netG,
        yieldG: totals.yieldG,
      };
    }
    nutritionTotal = addNutrition(nutritionTotal, calc.nutrition);
    costTotal += calc.cost;
    if (line.optional) warnings.push(`«${product.name}» отмечен как необязательный`);
    lines.push(calc);
  }

  const evaporationG = dish.evaporationG * scale;
  const afterEvap = Math.max(0, yieldSum - evaporationG);
  const finishingLossG = afterEvap * (dish.finishingLossPercent / 100);
  const finishedYieldG = Math.max(0, afterEvap - finishingLossG);
  const portionYieldG = finishedYieldG / portions;
  const target = dish.targetPortionG;
  const portionDeltaG = target > 0 ? portionYieldG - target : 0;

  if (target > 0 && Math.abs(portionDeltaG / target) > 0.12) {
    warnings.push(
      `выход порции ${Math.round(portionYieldG)} г отличается от плана ${Math.round(target)} г более чем на 12%`,
    );
  }
  if (finishedYieldG < 1) {
    warnings.push("выход блюда почти нулевой — проверьте коэффициенты");
  }

  return {
    dishId: dish.id,
    dishName: dish.name,
    portions,
    scaleFactor: scale,
    lines,
    totals: { ...totals, yieldG: yieldSum },
    finishedYieldG,
    portionYieldG,
    targetPortionG: target,
    portionDeltaG,
    nutritionTotal,
    nutritionPerPortion: scaleNutrition(nutritionTotal, 1 / portions),
    costTotal,
    costPerPortion: costTotal / portions,
    finishingLossG,
    evaporationG,
    warnings,
  };
}

export function fitToPortion(
  dish: Dish,
  products: Product[],
  portions: number,
  targetPortionG: number,
): DishCalc {
  const current = calcDish(dish, products, portions);
  if (current.portionYieldG <= 0) throw new Error("нельзя подогнать блюдо с нулевым выходом");
  const factor = targetPortionG / current.portionYieldG;
  const scaled: Dish = {
    ...dish,
    targetPortionG,
    lines: dish.lines.map((line) => ({ ...line, quantity: line.quantity * factor })),
  };
  return calcDish(scaled, products, portions);
}

export function portionsFromStock(
  dish: Dish,
  products: Product[],
  productId: string,
  stockG: number,
): number {
  const perBase = calcDish(dish, products, dish.basePortions);
  const used = perBase.lines
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.weights.grossG, 0);
  if (used <= 0) throw new Error(`продукт не входит в блюдо «${dish.name}»`);
  return (stockG / used) * dish.basePortions;
}

export function scaleDishQuantities(dish: Dish, portions: number): Dish {
  const factor = portions / dish.basePortions;
  return {
    ...dish,
    basePortions: portions,
    evaporationG: dish.evaporationG * factor,
    lines: dish.lines.map((line) => ({ ...line, quantity: line.quantity * factor })),
  };
}

export function emptyDishLine(): DishLine {
  return {
    id: "",
    productId: "",
    quantity: 0,
    unit: "gram",
    cold: "none",
    hot: "none",
    group: "main",
    optional: false,
    excludeFromYield: false,
    excludeFromShopping: false,
  };
}

export function emptyDish(): Dish {
  return {
    id: "",
    name: "Новое блюдо",
    category: "other",
    basePortions: 10,
    targetPortionG: 200,
    lines: [],
    steps: [],
    cookTimeMin: 20,
    prepTimeMin: 10,
    difficulty: 2,
    tags: [],
    finishingLossPercent: 0,
    evaporationG: 0,
    archived: false,
  };
}

export function emptyProduct(): Product {
  return {
    id: "",
    name: "Новый продукт",
    category: "other",
    defaultUnit: "gram",
    yieldProfile: {
      coldLoss: {
        peel: 0,
        trim: 0,
        bone: 0,
        scale: 0,
        gut: 0,
        defrost: 2,
        soak: 0,
        custom: 0,
      },
      hotYield: {
        boil: 100,
        steam: 100,
        stew: 100,
        fry: 100,
        deepFry: 100,
        bake: 100,
        grill: 100,
        blanch: 100,
        saute: 100,
        custom: 100,
      },
    },
    nutritionPer100g: zeroNutrition(),
    allergens: [],
    pricePerKg: 0,
    isSemiFinished: false,
    seasonMonths: [],
    archived: false,
  };
}
