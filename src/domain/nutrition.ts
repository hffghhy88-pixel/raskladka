import type { Nutrition } from "../types/models";

export function zeroNutrition(): Nutrition {
  return { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarG: 0, saltG: 0 };
}

export function nutr(
  kcal: number,
  proteinG: number,
  fatG: number,
  carbsG: number,
  extra: Partial<Nutrition> = {},
): Nutrition {
  return {
    kcal,
    proteinG,
    fatG,
    carbsG,
    fiberG: extra.fiberG ?? 0,
    sugarG: extra.sugarG ?? 0,
    saltG: extra.saltG ?? 0,
  };
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    kcal: n.kcal * factor,
    proteinG: n.proteinG * factor,
    fatG: n.fatG * factor,
    carbsG: n.carbsG * factor,
    fiberG: n.fiberG * factor,
    sugarG: n.sugarG * factor,
    saltG: n.saltG * factor,
  };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    fatG: a.fatG + b.fatG,
    carbsG: a.carbsG + b.carbsG,
    fiberG: a.fiberG + b.fiberG,
    sugarG: a.sugarG + b.sugarG,
    saltG: a.saltG + b.saltG,
  };
}

export function nutritionForGrams(per100: Nutrition, grams: number): Nutrition {
  return scaleNutrition(per100, grams / 100);
}

export function roundNutrition(n: Nutrition): Nutrition {
  return {
    kcal: Math.round(n.kcal),
    proteinG: Math.round(n.proteinG * 10) / 10,
    fatG: Math.round(n.fatG * 10) / 10,
    carbsG: Math.round(n.carbsG * 10) / 10,
    fiberG: Math.round(n.fiberG * 10) / 10,
    sugarG: Math.round(n.sugarG * 10) / 10,
    saltG: Math.round(n.saltG * 100) / 100,
  };
}

export function formatNutrition(n: Nutrition): string {
  const r = roundNutrition(n);
  return `${r.kcal} ккал · Б ${r.proteinG} · Ж ${r.fatG} · У ${r.carbsG}`;
}

export const ADULT_NORM = { kcal: 2200, proteinG: 75, fatG: 70, carbsG: 280 };
export const SCHOOL_NORM = { kcal: 1900, proteinG: 70, fatG: 65, carbsG: 260 };

export function coverage(actual: Nutrition, norm = ADULT_NORM) {
  const pct = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);
  return {
    kcalPct: pct(actual.kcal, norm.kcal),
    proteinPct: pct(actual.proteinG, norm.proteinG),
    fatPct: pct(actual.fatG, norm.fatG),
    carbsPct: pct(actual.carbsG, norm.carbsG),
  };
}
