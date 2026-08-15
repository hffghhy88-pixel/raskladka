import type { Workspace } from "../types/models";

export interface RustStatus {
  available: boolean;
  path: string | null;
  version?: string;
  error?: string;
}

export function toRustWorkspace(workspace: Workspace) {
  return {
    title: workspace.title,
    catalog: {
      products: workspace.products.map((p) => ({
        id: p.id,
        name: p.name,
        name_genitive: p.nameGenitive ?? null,
        category: p.category,
        subcategory: p.subcategory ?? null,
        default_unit: p.defaultUnit,
        density_g_per_ml: p.densityGPerMl ?? null,
        piece_weight_g: p.pieceWeightG ?? null,
        yield_profile: {
          cold_loss: {
            peel: p.yieldProfile.coldLoss.peel,
            trim: p.yieldProfile.coldLoss.trim,
            bone: p.yieldProfile.coldLoss.bone,
            scale: p.yieldProfile.coldLoss.scale,
            gut: p.yieldProfile.coldLoss.gut,
            defrost: p.yieldProfile.coldLoss.defrost,
            soak: p.yieldProfile.coldLoss.soak,
            custom: p.yieldProfile.coldLoss.custom,
          },
          hot_yield: {
            boil: p.yieldProfile.hotYield.boil,
            steam: p.yieldProfile.hotYield.steam,
            stew: p.yieldProfile.hotYield.stew,
            fry: p.yieldProfile.hotYield.fry,
            deep_fry: p.yieldProfile.hotYield.deepFry,
            bake: p.yieldProfile.hotYield.bake,
            grill: p.yieldProfile.hotYield.grill,
            blanch: p.yieldProfile.hotYield.blanch,
            saute: p.yieldProfile.hotYield.saute,
            custom: p.yieldProfile.hotYield.custom,
          },
        },
        nutrition_per_100g: {
          kcal: p.nutritionPer100g.kcal,
          protein_g: p.nutritionPer100g.proteinG,
          fat_g: p.nutritionPer100g.fatG,
          carbs_g: p.nutritionPer100g.carbsG,
          fiber_g: p.nutritionPer100g.fiberG,
          sugar_g: p.nutritionPer100g.sugarG,
          salt_g: p.nutritionPer100g.saltG,
        },
        allergens: p.allergens,
        price_per_kg: p.pricePerKg,
        supplier: p.supplier ?? null,
        notes: p.notes ?? null,
        is_semi_finished: p.isSemiFinished,
        source_dish_id: p.sourceDishId ?? null,
        storage_days: p.storageDays ?? null,
        season_months: p.seasonMonths,
        archived: p.archived,
      })),
    },
    dishes: {
      dishes: workspace.dishes.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        base_portions: d.basePortions,
        target_portion_g: d.targetPortionG,
        lines: d.lines.map((l) => ({
          id: l.id,
          product_id: l.productId,
          quantity: l.quantity,
          unit: l.unit,
          cold: l.cold,
          hot: l.hot,
          cold_loss_override: l.coldLossOverride ?? null,
          hot_yield_override: l.hotYieldOverride ?? null,
          group: l.group === "garnish_extra" ? "garnish_extra" : l.group,
          note: l.note ?? null,
          optional: l.optional,
          exclude_from_yield: l.excludeFromYield,
          exclude_from_shopping: l.excludeFromShopping,
        })),
        steps: d.steps,
        description: d.description ?? null,
        cook_time_min: d.cookTimeMin,
        prep_time_min: d.prepTimeMin,
        difficulty: d.difficulty,
        tags: d.tags,
        cuisine: d.cuisine ?? null,
        finishing_loss_percent: d.finishingLossPercent,
        evaporation_g: d.evaporationG,
        archived: d.archived,
      })),
    },
    menus: {
      menus: workspace.menus.map((m) => ({
        id: m.id,
        name: m.name,
        period_from: m.periodFrom ?? null,
        period_to: m.periodTo ?? null,
        guests: m.guests,
        days: m.days.map((day) => ({
          id: day.id,
          date_label: day.dateLabel,
          guests_override: day.guestsOverride ?? null,
          slots: day.slots.map((s) => ({
            id: s.id,
            dish_id: s.dishId,
            portions: s.portions,
            meal: s.meal,
            note: s.note ?? null,
          })),
        })),
        venue: m.venue ?? null,
        notes: m.notes ?? null,
        archived: m.archived,
      })),
    },
    inventory: {
      items: workspace.inventory.map((i) => ({
        product_id: i.productId,
        quantity_g: i.quantityG,
        reserved_g: i.reservedG,
        min_g: i.minG,
        location: i.location ?? null,
      })),
    },
    cost: {
      markup_percent: workspace.cost.markupPercent,
      overhead_percent: workspace.cost.overheadPercent,
      vat_percent: workspace.cost.vatPercent,
    },
  };
}

export async function probeRust(): Promise<RustStatus> {
  if (!window.raskladka) {
    return { available: false, path: null, error: "приложение открыто в браузере, Electron API нет" };
  }
  const available = await window.raskladka.rustAvailable();
  const rustPath = await window.raskladka.rustPath();
  if (!available) {
    return { available: false, path: rustPath, error: "бинарник не найден — npm run rust:build" };
  }
  try {
    const raw = await window.raskladka.rustExec(
      JSON.stringify({ workspace: { title: "probe" }, command: { cmd: "ping" } }),
    );
    const parsed = JSON.parse(raw) as { type?: string; version?: string; message?: string };
    if (parsed.type === "pong") return { available: true, path: rustPath, version: parsed.version };
    return { available: true, path: rustPath, error: parsed.message ?? raw };
  } catch (err) {
    return { available: false, path: rustPath, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function rustCommand(workspace: Workspace, command: Record<string, unknown>): Promise<unknown> {
  if (!window.raskladka) throw new Error("нет Electron API");
  const raw = await window.raskladka.rustExec(
    JSON.stringify({ workspace: toRustWorkspace(workspace), command }),
  );
  return JSON.parse(raw);
}
