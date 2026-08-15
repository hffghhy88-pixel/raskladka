import type { MealKind, Menu, MenuDay, MenuSlot } from "../types/models";

function slot(id: string, dishId: string, portions: number, meal: MealKind): MenuSlot {
  return { id, dishId, portions, meal };
}

function day(id: string, dateLabel: string, slots: MenuSlot[]): MenuDay {
  return { id, dateLabel, slots };
}

export const SEED_MENUS: Menu[] = [
  {
    id: "canteen-week",
    name: "Столовая · рабочая неделя",
    periodFrom: "2026-08-17",
    periodTo: "2026-08-21",
    guests: 40,
    venue: "Производственная столовая",
    notes: "Завтрак + обед. Порции совпадают с числом гостей, если не указано иначе.",
    archived: false,
    days: [
      day("mon", "Понедельник", [
        slot("mon-b1", "porridge-oats", 40, "breakfast"),
        slot("mon-b2", "cocoa-drink", 40, "breakfast"),
        slot("mon-l1", "borsch", 40, "lunch"),
        slot("mon-l2", "kotlety", 40, "lunch"),
        slot("mon-l3", "puree", 40, "lunch"),
        slot("mon-l4", "compote", 40, "lunch"),
      ]),
      day("tue", "Вторник", [
        slot("tue-b1", "omelette", 40, "breakfast"),
        slot("tue-b2", "tea-cup", 40, "breakfast"),
        slot("tue-l1", "schi", 40, "lunch"),
        slot("tue-l2", "goulash", 40, "lunch"),
        slot("tue-l3", "buckwheat-side", 40, "lunch"),
        slot("tue-l4", "vinegret", 40, "lunch"),
        slot("tue-l5", "kissel", 40, "lunch"),
      ]),
      day("wed", "Среда", [
        slot("wed-b1", "syrniki", 40, "breakfast"),
        slot("wed-b2", "cocoa-drink", 40, "breakfast"),
        slot("wed-l1", "solyanka", 40, "lunch"),
        slot("wed-l2", "chicken-bake", 40, "lunch"),
        slot("wed-l3", "rice-side", 40, "lunch"),
        slot("wed-l4", "compote", 40, "lunch"),
      ]),
      day("thu", "Четверг", [
        slot("thu-b1", "bliny", 40, "breakfast"),
        slot("thu-b2", "tea-cup", 40, "breakfast"),
        slot("thu-l1", "ukha", 40, "lunch"),
        slot("thu-l2", "fish-fry", 40, "lunch"),
        slot("thu-l3", "puree", 40, "lunch"),
        slot("thu-l4", "olivier", 20, "lunch"),
        slot("thu-l5", "kissel", 40, "lunch"),
      ]),
      day("fri", "Пятница", [
        slot("fri-b1", "porridge-oats", 40, "breakfast"),
        slot("fri-b2", "tea-cup", 40, "breakfast"),
        slot("fri-l1", "borsch", 40, "lunch"),
        slot("fri-l2", "liver-stew", 40, "lunch"),
        slot("fri-l3", "pasta-side", 40, "lunch"),
        slot("fri-l4", "stewed-cabbage", 20, "lunch"),
        slot("fri-l5", "compote", 40, "lunch"),
      ]),
    ],
  },
  {
    id: "banquet-saturday",
    name: "Банкет на 25 персон",
    guests: 25,
    venue: "Зал",
    notes: "Холодные закуски + горячее + напиток.",
    archived: false,
    days: [
      day("sat", "Суббота", [
        slot("sat-1", "olivier", 25, "banquet"),
        slot("sat-2", "herring-fur", 25, "banquet"),
        slot("sat-3", "vinegret", 25, "banquet"),
        slot("sat-4", "beef-stroganoff", 25, "banquet"),
        slot("sat-5", "puree", 25, "banquet"),
        slot("sat-6", "compote", 25, "banquet"),
        slot("sat-7", "pirog-cabbage", 25, "banquet"),
      ]),
    ],
  },
];
