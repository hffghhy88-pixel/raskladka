import type { Dish, DishCategory, MealKind, Menu, MenuDay, Product } from "../types/models";
import { calcDish, findDish } from "./calc";
import { formatMassGrams } from "./units";

export interface ProductionTask {
  dishId: string;
  dishName: string;
  meal: MealKind;
  portions: number;
  startBatchG: number;
  finishedG: number;
  cookTimeMin: number;
  prepTimeMin: number;
}

export interface StationLoad {
  station: string;
  dishes: number;
  finishedG: number;
  minutes: number;
}

export interface ProductionPlan {
  dateLabel: string;
  guests: number;
  tasks: ProductionTask[];
  totalPrepMin: number;
  totalCookMin: number;
  totalFinishedG: number;
  byStation: StationLoad[];
}

export function planDay(menu: Menu, day: MenuDay, dishes: Dish[], products: Product[]): ProductionPlan {
  const tasks: ProductionTask[] = [];
  const stations = new Map<string, StationLoad>();
  let prep = 0;
  let cook = 0;
  let finished = 0;

  for (const slot of day.slots) {
    const dish = findDish(dishes, slot.dishId);
    const calc = calcDish(dish, products, slot.portions);
    const station = stationFor(dish.category);
    const entry = stations.get(station) ?? { station, dishes: 0, finishedG: 0, minutes: 0 };
    entry.dishes += 1;
    entry.finishedG += calc.finishedYieldG;
    entry.minutes += dish.prepTimeMin + dish.cookTimeMin;
    stations.set(station, entry);
    prep += dish.prepTimeMin;
    cook += dish.cookTimeMin;
    finished += calc.finishedYieldG;
    tasks.push({
      dishId: dish.id,
      dishName: dish.name,
      meal: slot.meal,
      portions: slot.portions,
      startBatchG: calc.totals.grossG,
      finishedG: calc.finishedYieldG,
      cookTimeMin: dish.cookTimeMin,
      prepTimeMin: dish.prepTimeMin,
    });
  }

  const mealOrder: Record<MealKind, number> = {
    breakfast: 0,
    lunch: 1,
    snack: 2,
    dinner: 3,
    supper: 4,
    banquet: 5,
    custom: 6,
  };
  tasks.sort((a, b) => mealOrder[a.meal] - mealOrder[b.meal] || a.dishName.localeCompare(b.dishName, "ru"));

  return {
    dateLabel: day.dateLabel,
    guests: day.guestsOverride ?? menu.guests,
    tasks,
    totalPrepMin: prep,
    totalCookMin: cook,
    totalFinishedG: finished,
    byStation: [...stations.values()],
  };
}

function stationFor(category: DishCategory): string {
  switch (category) {
    case "soup":
      return "Суповой";
    case "salad":
    case "appetizer":
      return "Холодный цех";
    case "main":
      return "Горячий цех";
    case "side":
      return "Гарнирный";
    case "sauce":
      return "Соусный";
    case "drink":
      return "Напитки";
    case "bakery":
    case "dessert":
      return "Мучной / сладкий";
    case "breakfast":
      return "Завтраки";
    case "semi_finished":
      return "Заготовка";
    default:
      return "Общий";
  }
}

export function planText(plan: ProductionPlan): string {
  const lines = plan.tasks.map(
    (task) =>
      `• ${task.dishName} — ${task.portions} порц., закладка ${formatMassGrams(task.startBatchG)}, выход ${formatMassGrams(task.finishedG)}, ${task.prepTimeMin + task.cookTimeMin} мин`,
  );
  return `Производство · ${plan.dateLabel} · гостей ${plan.guests} · выход ${formatMassGrams(plan.totalFinishedG)}\n${lines.join("\n")}`;
}
