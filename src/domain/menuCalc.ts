import type { DayCalc, Dish, Menu, MenuCalc, Product, SlotCalc } from "../types/models";
import { calcDish, findDish } from "./calc";
import { addNutrition, scaleNutrition, zeroNutrition } from "./nutrition";
import { addWeights, zeroWeights } from "./calc";

export function calcMenu(menu: Menu, dishes: Dish[], products: Product[]): MenuCalc {
  const days: DayCalc[] = [];
  let totals = zeroWeights();
  let finished = 0;
  let nutrition = zeroNutrition();
  let cost = 0;
  let slotCount = 0;
  const warnings: string[] = [];
  const dishIds = new Set<string>();

  for (const day of menu.days) {
    const guests = day.guestsOverride ?? menu.guests;
    const slots: SlotCalc[] = [];
    let dayTotals = zeroWeights();
    let dayFinished = 0;
    let dayNutrition = zeroNutrition();
    let dayCost = 0;

    for (const slot of day.slots) {
      const dish = findDish(dishes, slot.dishId);
      const calc = calcDish(dish, products, slot.portions);
      dayTotals = addWeights(dayTotals, calc.totals);
      dayFinished += calc.finishedYieldG;
      dayNutrition = addNutrition(dayNutrition, calc.nutritionTotal);
      dayCost += calc.costTotal;
      warnings.push(...calc.warnings);
      dishIds.add(dish.id);
      slots.push({ slot, dishName: dish.name, calc });
      slotCount += 1;
    }

    totals = addWeights(totals, dayTotals);
    finished += dayFinished;
    nutrition = addNutrition(nutrition, dayNutrition);
    cost += dayCost;

    days.push({
      dayId: day.id,
      dateLabel: day.dateLabel,
      guests,
      slots,
      totals: dayTotals,
      finishedYieldG: dayFinished,
      nutrition: dayNutrition,
      cost: dayCost,
      perGuestYieldG: guests > 0 ? dayFinished / guests : 0,
      perGuestNutrition: guests > 0 ? scaleNutrition(dayNutrition, 1 / guests) : zeroNutrition(),
      perGuestCost: guests > 0 ? dayCost / guests : 0,
    });
  }

  return {
    menuId: menu.id,
    menuName: menu.name,
    days,
    totals,
    finishedYieldG: finished,
    nutrition,
    cost,
    dishCount: dishIds.size,
    slotCount,
    warnings,
  };
}

export function emptyMenu(): Menu {
  return {
    id: "",
    name: "Новое меню",
    guests: 20,
    days: [],
    archived: false,
  };
}
