import type { Unit, UnitFamily } from "../types/models";

export interface ConversionContext {
  densityGPerMl?: number;
  pieceWeightG?: number;
  portionWeightG?: number;
}

export const UNIT_META: Record<
  Unit,
  { code: string; name: string; family: UnitFamily; ml?: number; grams?: number }
> = {
  milligram: { code: "мг", name: "миллиграмм", family: "mass", grams: 0.001 },
  gram: { code: "г", name: "грамм", family: "mass", grams: 1 },
  kilogram: { code: "кг", name: "килограмм", family: "mass", grams: 1000 },
  milliliter: { code: "мл", name: "миллилитр", family: "volume", ml: 1 },
  liter: { code: "л", name: "литр", family: "volume", ml: 1000 },
  teaspoon: { code: "ч.л.", name: "чайная ложка", family: "volume", ml: 5 },
  tablespoon: { code: "ст.л.", name: "столовая ложка", family: "volume", ml: 15 },
  cup: { code: "чашка", name: "чашка (240 мл)", family: "volume", ml: 240 },
  glass: { code: "стакан", name: "стакан (200 мл)", family: "volume", ml: 200 },
  pinch: { code: "щепотка", name: "щепотка", family: "volume", ml: 0.3 },
  piece: { code: "шт", name: "штука", family: "count" },
  bunch: { code: "пучок", name: "пучок", family: "count" },
  clove: { code: "зубчик", name: "зубчик", family: "count" },
  head: { code: "головка", name: "головка", family: "count" },
  slice: { code: "ломтик", name: "ломтик", family: "count" },
  packet: { code: "пакет", name: "пакет", family: "count" },
  can: { code: "банка", name: "банка", family: "count" },
  portion: { code: "порц.", name: "порция", family: "portion" },
};

export const ALL_UNITS = Object.keys(UNIT_META) as Unit[];

export function unitCode(unit: Unit): string {
  return UNIT_META[unit].code;
}

export function unitName(unit: Unit): string {
  return UNIT_META[unit].name;
}

export function unitFamily(unit: Unit): UnitFamily {
  return UNIT_META[unit].family;
}

export function parseUnit(raw: string): Unit {
  const key = raw.trim().toLowerCase().replaceAll("ё", "е").replaceAll(".", "").replaceAll(" ", "");
  const map: Record<string, Unit> = {
    мг: "milligram",
    mg: "milligram",
    г: "gram",
    гр: "gram",
    g: "gram",
    кг: "kilogram",
    kg: "kilogram",
    мл: "milliliter",
    ml: "milliliter",
    л: "liter",
    l: "liter",
    чл: "teaspoon",
    члн: "teaspoon",
    tsp: "teaspoon",
    стл: "tablespoon",
    стлн: "tablespoon",
    tbsp: "tablespoon",
    чашка: "cup",
    cup: "cup",
    стакан: "glass",
    glass: "glass",
    шт: "piece",
    штука: "piece",
    piece: "piece",
    пучок: "bunch",
    bunch: "bunch",
    зубчик: "clove",
    clove: "clove",
    щепотка: "pinch",
    pinch: "pinch",
    головка: "head",
    head: "head",
    ломтик: "slice",
    slice: "slice",
    пакет: "packet",
    packet: "packet",
    банка: "can",
    can: "can",
    порц: "portion",
    порция: "portion",
    portion: "portion",
  };
  const unit = map[key];
  if (!unit) throw new Error(`неизвестная единица: ${raw}`);
  return unit;
}

export function gramsPerUnit(unit: Unit, ctx: ConversionContext): number {
  const meta = UNIT_META[unit];
  if (meta.grams != null) return meta.grams;
  if (meta.ml != null) {
    if (!ctx.densityGPerMl || ctx.densityGPerMl <= 0) {
      throw new Error(`нет плотности для перевода ${meta.code} в граммы`);
    }
    return meta.ml * ctx.densityGPerMl;
  }
  if (unit === "portion") {
    if (!ctx.portionWeightG || ctx.portionWeightG <= 0) {
      throw new Error("нет веса порции");
    }
    return ctx.portionWeightG;
  }
  if (!ctx.pieceWeightG || ctx.pieceWeightG <= 0) {
    throw new Error(`нет веса штуки для ${meta.code}`);
  }
  return ctx.pieceWeightG;
}

export function convert(value: number, from: Unit, to: Unit, ctx: ConversionContext): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`некорректное количество: ${value}`);
  if (from === to) return value;
  const grams = value * gramsPerUnit(from, ctx);
  const perTo = gramsPerUnit(to, ctx);
  if (perTo === 0) throw new Error("нулевой знаменатель перевода");
  return grams / perTo;
}

export function toGrams(value: number, unit: Unit, ctx: ConversionContext): number {
  return convert(value, unit, "gram", ctx);
}

export function fromGrams(grams: number, unit: Unit, ctx: ConversionContext): number {
  return convert(grams, "gram", unit, ctx);
}

export function formatRu(value: number, digits: number, suffix: string): string {
  if (!Number.isFinite(value)) return "—";
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  let text =
    digits === 0
      ? rounded.toFixed(0)
      : rounded
          .toFixed(digits)
          .replace(/\.?0+$/, "")
          .replace(/\.$/, "");
  return `${text.replace(".", ",")} ${suffix}`;
}

export function formatMassGrams(grams: number): string {
  if (!Number.isFinite(grams)) return "—";
  const abs = Math.abs(grams);
  if (abs >= 1000) return formatRu(grams / 1000, 3, "кг");
  if (abs >= 1) return formatRu(grams, 1, "г");
  return formatRu(grams * 1000, 0, "мг");
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2).replace(".", ",")} ₽`;
}

export function prettyQty(
  grams: number,
  preferred: Unit,
  ctx: ConversionContext,
): { qty: number; unit: Unit; label: string } {
  if (UNIT_META[preferred].family === "mass") {
    if (grams >= 1000) {
      return { qty: grams / 1000, unit: "kilogram", label: formatRu(grams / 1000, 2, "кг") };
    }
    return { qty: grams, unit: "gram", label: formatRu(grams, 1, "г") };
  }
  try {
    const qty = fromGrams(grams, preferred, ctx);
    return { qty, unit: preferred, label: formatRu(qty, 2, unitCode(preferred)) };
  } catch {
    if (grams >= 1000) {
      return { qty: grams / 1000, unit: "kilogram", label: formatRu(grams / 1000, 2, "кг") };
    }
    return { qty: grams, unit: "gram", label: formatRu(grams, 1, "г") };
  }
}
