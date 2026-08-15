import { nutr } from "../domain/nutrition";
import { cloneYield, YIELD_PRESETS } from "../domain/yield";
import type { Product, ProductCategory, Unit, YieldKind } from "../types/models";

interface Spec {
  id: string;
  name: string;
  gen?: string;
  cat: ProductCategory;
  sub?: string;
  unit?: Unit;
  density?: number;
  piece?: number;
  price: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
  yield: YieldKind;
  allergens?: string[];
  notes?: string;
  storage?: number;
}

function make(spec: Spec): Product {
  return {
    id: spec.id,
    name: spec.name,
    nameGenitive: spec.gen,
    category: spec.cat,
    subcategory: spec.sub,
    defaultUnit: spec.unit ?? "kilogram",
    densityGPerMl: spec.density,
    pieceWeightG: spec.piece,
    yieldProfile: cloneYield(YIELD_PRESETS[spec.yield]),
    nutritionPer100g: nutr(spec.kcal, spec.p, spec.f, spec.c, {
      fiberG: spec.fiber ?? 0,
      sugarG: spec.sugar ?? 0,
      saltG: spec.salt ?? 0,
    }),
    allergens: spec.allergens ?? [],
    pricePerKg: spec.price,
    notes: spec.notes,
    isSemiFinished: false,
    storageDays: spec.storage,
    seasonMonths: [],
    archived: false,
  };
}

export const SEED_PRODUCTS: Product[] = [
  make({ id: "potato", name: "Картофель", gen: "картофеля", cat: "vegetables", sub: "корнеплоды", price: 42, kcal: 77, p: 2, f: 0.1, c: 16.3, fiber: 1.4, yield: "root", storage: 40 }),
  make({ id: "carrot", name: "Морковь", gen: "моркови", cat: "vegetables", sub: "корнеплоды", price: 48, kcal: 35, p: 0.9, f: 0.2, c: 6.8, fiber: 2.8, yield: "root", storage: 30 }),
  make({ id: "beet", name: "Свёкла", gen: "свёклы", cat: "vegetables", sub: "корнеплоды", price: 40, kcal: 43, p: 1.6, f: 0.2, c: 9.6, fiber: 2.8, yield: "root", storage: 40 }),
  make({ id: "onion", name: "Лук репчатый", gen: "лука", cat: "vegetables", price: 38, kcal: 41, p: 1.4, f: 0.2, c: 8.2, fiber: 1.7, yield: "onion", piece: 90, storage: 40 }),
  make({ id: "garlic", name: "Чеснок", gen: "чеснока", cat: "vegetables", unit: "piece", piece: 4, price: 280, kcal: 143, p: 6.4, f: 0.5, c: 29.9, yield: "onion", storage: 60 }),
  make({ id: "cabbage", name: "Капуста белокочанная", cat: "vegetables", price: 32, kcal: 28, p: 1.8, f: 0.1, c: 4.7, fiber: 2.0, yield: "cabbage", storage: 25 }),
  make({ id: "cabbage-red", name: "Капуста краснокочанная", cat: "vegetables", price: 55, kcal: 31, p: 1.4, f: 0.2, c: 6.1, fiber: 2.1, yield: "cabbage" }),
  make({ id: "sauerkraut", name: "Капуста квашеная", cat: "vegetables", price: 90, kcal: 19, p: 0.9, f: 0.1, c: 3.0, yield: "none", salt: 1.8 }),
  make({ id: "tomato", name: "Помидоры", cat: "vegetables", price: 160, kcal: 20, p: 0.9, f: 0.2, c: 3.9, fiber: 1.2, yield: "root", piece: 110 }),
  make({ id: "cucumber", name: "Огурцы", cat: "vegetables", price: 140, kcal: 15, p: 0.8, f: 0.1, c: 2.5, fiber: 0.7, yield: "root", piece: 120 }),
  make({ id: "pickle", name: "Огурцы солёные", cat: "vegetables", price: 130, kcal: 11, p: 0.8, f: 0.1, c: 1.7, yield: "none", salt: 2.2 }),
  make({ id: "pepper", name: "Перец сладкий", cat: "vegetables", price: 220, kcal: 27, p: 1.3, f: 0.3, c: 5.3, fiber: 1.5, yield: "root", piece: 140 }),
  make({ id: "zucchini", name: "Кабачок", cat: "vegetables", price: 70, kcal: 24, p: 0.6, f: 0.3, c: 4.6, yield: "root" }),
  make({ id: "eggplant", name: "Баклажан", cat: "vegetables", price: 110, kcal: 24, p: 1.2, f: 0.1, c: 4.5, yield: "root" }),
  make({ id: "pumpkin", name: "Тыква", cat: "vegetables", price: 45, kcal: 22, p: 1.0, f: 0.1, c: 4.4, yield: "root" }),
  make({ id: "radish", name: "Редис", cat: "vegetables", price: 130, kcal: 16, p: 1.2, f: 0.1, c: 2.4, yield: "root" }),
  make({ id: "turnip", name: "Репа", cat: "vegetables", price: 60, kcal: 28, p: 0.9, f: 0.1, c: 6.2, yield: "root" }),
  make({ id: "celery-root", name: "Сельдерей корневой", cat: "vegetables", price: 95, kcal: 32, p: 1.5, f: 0.3, c: 6.5, yield: "root" }),
  make({ id: "parsley-root", name: "Петрушка корневая", cat: "vegetables", price: 120, kcal: 49, p: 1.5, f: 0.6, c: 10.1, yield: "root" }),
  make({ id: "green-onion", name: "Лук зелёный", cat: "greens", unit: "bunch", piece: 40, price: 320, kcal: 20, p: 1.3, f: 0.1, c: 3.2, yield: "greens" }),
  make({ id: "dill", name: "Укроп", cat: "greens", unit: "bunch", piece: 30, price: 450, kcal: 40, p: 2.5, f: 0.5, c: 6.3, yield: "greens" }),
  make({ id: "parsley", name: "Петрушка", cat: "greens", unit: "bunch", piece: 30, price: 450, kcal: 49, p: 3.7, f: 0.4, c: 7.6, yield: "greens" }),
  make({ id: "lettuce", name: "Салат листовой", cat: "greens", price: 280, kcal: 15, p: 1.4, f: 0.2, c: 2.2, yield: "greens" }),
  make({ id: "spinach", name: "Шпинат", cat: "greens", price: 260, kcal: 23, p: 2.9, f: 0.4, c: 2.0, yield: "greens" }),
  make({ id: "sorrel", name: "Щавель", cat: "greens", price: 200, kcal: 22, p: 1.5, f: 0.3, c: 2.9, yield: "greens" }),
  make({ id: "apple", name: "Яблоки", cat: "fruits", price: 110, kcal: 47, p: 0.4, f: 0.4, c: 9.8, fiber: 1.8, sugar: 9, yield: "root", piece: 160 }),
  make({ id: "pear", name: "Груши", cat: "fruits", price: 160, kcal: 42, p: 0.4, f: 0.3, c: 10.3, yield: "root", piece: 150 }),
  make({ id: "lemon", name: "Лимон", cat: "fruits", unit: "piece", piece: 90, price: 220, kcal: 16, p: 0.9, f: 0.1, c: 3.0, yield: "root" }),
  make({ id: "orange", name: "Апельсин", cat: "fruits", unit: "piece", piece: 180, price: 140, kcal: 43, p: 0.9, f: 0.2, c: 8.1, yield: "root" }),
  make({ id: "banana", name: "Банан", cat: "fruits", unit: "piece", piece: 120, price: 130, kcal: 96, p: 1.5, f: 0.2, c: 21.8, yield: "root" }),
  make({ id: "plum", name: "Слива", cat: "fruits", price: 150, kcal: 42, p: 0.8, f: 0.3, c: 9.6, yield: "root" }),
  make({ id: "berries-mix", name: "Ягоды смесь", cat: "berries", price: 380, kcal: 43, p: 0.7, f: 0.4, c: 8.0, yield: "none" }),
  make({ id: "cranberry", name: "Клюква", cat: "berries", price: 420, kcal: 26, p: 0.5, f: 0.2, c: 3.8, yield: "none" }),
  make({ id: "mushroom-champ", name: "Шампиньоны", cat: "mushrooms", price: 280, kcal: 27, p: 4.3, f: 1.0, c: 0.1, yield: "root" }),
  make({ id: "mushroom-forest", name: "Грибы лесные варёные", cat: "mushrooms", price: 350, kcal: 30, p: 3.7, f: 1.7, c: 1.1, yield: "none" }),
  make({ id: "beef", name: "Говядина лопатка", cat: "meat", price: 720, kcal: 187, p: 18.9, f: 12.4, c: 0, yield: "meat", allergens: [] }),
  make({ id: "beef-brisket", name: "Говядина грудинка", cat: "meat", price: 640, kcal: 217, p: 17.6, f: 16.0, c: 0, yield: "meat" }),
  make({ id: "pork", name: "Свинина шея", cat: "meat", price: 480, kcal: 267, p: 16.1, f: 21.7, c: 0, yield: "meat" }),
  make({ id: "pork-loin", name: "Свинина вырезка", cat: "meat", price: 620, kcal: 142, p: 19.4, f: 7.1, c: 0, yield: "meat" }),
  make({ id: "mince-beef", name: "Фарш говяжий", cat: "meat", price: 560, kcal: 209, p: 17.2, f: 15.0, c: 0, yield: "meat" }),
  make({ id: "mince-pork", name: "Фарш свиной", cat: "meat", price: 420, kcal: 263, p: 17.0, f: 21.5, c: 0, yield: "meat" }),
  make({ id: "mince-mix", name: "Фарш домашний", cat: "meat", price: 470, kcal: 236, p: 17.1, f: 18.2, c: 0, yield: "meat" }),
  make({ id: "chicken", name: "Курица тушка", cat: "poultry", price: 230, kcal: 190, p: 16.2, f: 14.1, c: 0, yield: "poultry" }),
  make({ id: "chicken-fillet", name: "Филе куриное", cat: "poultry", price: 340, kcal: 113, p: 23.6, f: 1.9, c: 0.4, yield: "poultry" }),
  make({ id: "chicken-thigh", name: "Бедро куриное", cat: "poultry", price: 280, kcal: 185, p: 18.2, f: 11.2, c: 0, yield: "poultry" }),
  make({ id: "turkey", name: "Индейка филе", cat: "poultry", price: 430, kcal: 117, p: 23.7, f: 1.5, c: 0, yield: "poultry" }),
  make({ id: "liver-beef", name: "Печень говяжья", cat: "meat", price: 320, kcal: 127, p: 17.9, f: 3.7, c: 5.3, yield: "meat" }),
  make({ id: "sausage-doctor", name: "Колбаса варёная", cat: "meat", price: 390, kcal: 257, p: 12.8, f: 22.2, c: 1.5, yield: "none", allergens: ["молоко"] }),
  make({ id: "ham", name: "Ветчина", cat: "meat", price: 480, kcal: 145, p: 17.6, f: 8.3, c: 0.3, yield: "none" }),
  make({ id: "fish-cod", name: "Треска", cat: "fish", price: 520, kcal: 69, p: 16.0, f: 0.6, c: 0, yield: "fish" }),
  make({ id: "fish-pollock", name: "Минтай", cat: "fish", price: 280, kcal: 72, p: 15.9, f: 0.9, c: 0, yield: "fish" }),
  make({ id: "fish-salmon", name: "Сёмга", cat: "fish", price: 980, kcal: 142, p: 19.8, f: 6.3, c: 0, yield: "fish" }),
  make({ id: "fish-herring", name: "Сельдь солёная", cat: "fish", price: 320, kcal: 217, p: 19.8, f: 15.4, c: 0, yield: "none", salt: 4.8 }),
  make({ id: "shrimp", name: "Креветки", cat: "seafood", price: 890, kcal: 95, p: 18.9, f: 2.2, c: 0, yield: "none" }),
  make({ id: "milk", name: "Молоко 3,2%", cat: "dairy", unit: "liter", density: 1.03, price: 85, kcal: 60, p: 2.9, f: 3.2, c: 4.7, yield: "dairy", allergens: ["молоко"] }),
  make({ id: "milk-baked", name: "Ряженка", cat: "dairy", unit: "liter", density: 1.03, price: 110, kcal: 67, p: 2.8, f: 4.0, c: 4.2, yield: "dairy", allergens: ["молоко"] }),
  make({ id: "kefir", name: "Кефир 2,5%", cat: "dairy", unit: "liter", density: 1.03, price: 90, kcal: 50, p: 2.9, f: 2.5, c: 4.0, yield: "dairy", allergens: ["молоко"] }),
  make({ id: "sour-cream", name: "Сметана 20%", cat: "dairy", density: 0.99, price: 240, kcal: 206, p: 2.8, f: 20.0, c: 3.2, yield: "dairy", allergens: ["молоко"] }),
  make({ id: "cream", name: "Сливки 20%", cat: "dairy", density: 1.0, price: 280, kcal: 205, p: 2.8, f: 20.0, c: 3.7, yield: "dairy", allergens: ["молоко"] }),
  make({ id: "cottage", name: "Творог 9%", cat: "dairy", price: 320, kcal: 159, p: 16.7, f: 9.0, c: 2.0, yield: "none", allergens: ["молоко"] }),
  make({ id: "cottage-soft", name: "Творог мягкий 5%", cat: "dairy", price: 300, kcal: 121, p: 17.2, f: 5.0, c: 1.8, yield: "none", allergens: ["молоко"] }),
  make({ id: "cheese", name: "Сыр российский", cat: "dairy", price: 620, kcal: 363, p: 23.2, f: 29.5, c: 0.3, yield: "none", allergens: ["молоко"] }),
  make({ id: "butter", name: "Масло сливочное 82%", cat: "dairy", price: 780, kcal: 748, p: 0.5, f: 82.5, c: 0.8, yield: "none", allergens: ["молоко"] }),
  make({ id: "egg", name: "Яйцо куриное", cat: "eggs", unit: "piece", piece: 50, price: 140, kcal: 157, p: 12.7, f: 11.5, c: 0.7, yield: "none", allergens: ["яйца"] }),
  make({ id: "rice", name: "Рис круглозёрный", cat: "groats", price: 95, kcal: 333, p: 7.0, f: 1.0, c: 74.0, yield: "groats" }),
  make({ id: "rice-long", name: "Рис длиннозёрный", cat: "groats", price: 110, kcal: 365, p: 7.4, f: 0.6, c: 79.0, yield: "groats" }),
  make({ id: "buckwheat", name: "Гречка ядрица", cat: "groats", price: 92, kcal: 313, p: 12.6, f: 3.3, c: 62.1, fiber: 11.3, yield: "groats" }),
  make({ id: "millet", name: "Пшено", cat: "groats", price: 70, kcal: 348, p: 11.5, f: 3.3, c: 66.5, yield: "groats" }),
  make({ id: "oats", name: "Овсяные хлопья", cat: "groats", price: 85, kcal: 352, p: 12.3, f: 6.1, c: 59.5, fiber: 8, yield: "groats" }),
  make({ id: "semolina", name: "Манная крупа", cat: "groats", price: 65, kcal: 328, p: 10.3, f: 1.0, c: 67.4, yield: "groats", allergens: ["глютен"] }),
  make({ id: "pearl", name: "Перловка", cat: "groats", price: 55, kcal: 315, p: 9.3, f: 1.1, c: 66.9, yield: "groats" }),
  make({ id: "wheat-groats", name: "Пшеничная крупа", cat: "groats", price: 60, kcal: 316, p: 11.5, f: 1.3, c: 62.0, yield: "groats", allergens: ["глютен"] }),
  make({ id: "flour", name: "Мука пшеничная в/с", cat: "flour", price: 55, kcal: 334, p: 10.3, f: 1.1, c: 68.9, yield: "none", allergens: ["глютен"] }),
  make({ id: "flour-rye", name: "Мука ржаная", cat: "flour", price: 58, kcal: 298, p: 8.9, f: 1.7, c: 61.8, yield: "none", allergens: ["глютен"] }),
  make({ id: "starch", name: "Крахмал картофельный", cat: "flour", price: 90, kcal: 313, p: 0.1, f: 0, c: 78.2, yield: "none" }),
  make({ id: "pasta", name: "Макароны", cat: "pasta", price: 72, kcal: 337, p: 10.4, f: 1.1, c: 69.7, yield: "pasta", allergens: ["глютен"] }),
  make({ id: "noodles", name: "Лапша яичная", cat: "pasta", price: 110, kcal: 384, p: 14.2, f: 4.4, c: 71.0, yield: "pasta", allergens: ["глютен", "яйца"] }),
  make({ id: "bread-wheat", name: "Хлеб пшеничный", cat: "bakery", price: 80, kcal: 242, p: 7.6, f: 0.8, c: 49.2, yield: "none", allergens: ["глютен"] }),
  make({ id: "bread-rye", name: "Хлеб ржаной", cat: "bakery", price: 78, kcal: 201, p: 6.6, f: 1.2, c: 40.7, yield: "none", allergens: ["глютен"] }),
  make({ id: "breadcrumbs", name: "Сухари панировочные", cat: "bakery", price: 95, kcal: 347, p: 9.7, f: 1.9, c: 72.5, yield: "none", allergens: ["глютен"] }),
  make({ id: "peas", name: "Горох сухой", cat: "legumes", price: 68, kcal: 298, p: 20.5, f: 2.0, c: 49.5, yield: "groats" }),
  make({ id: "beans", name: "Фасоль сухая", cat: "legumes", price: 110, kcal: 298, p: 21.0, f: 2.0, c: 47.0, yield: "groats" }),
  make({ id: "lentils", name: "Чечевица", cat: "legumes", price: 130, kcal: 295, p: 24.0, f: 1.5, c: 46.3, yield: "groats" }),
  make({ id: "sunflower", name: "Семечки очищенные", cat: "nuts", price: 280, kcal: 601, p: 20.7, f: 52.9, c: 10.5, yield: "none" }),
  make({ id: "walnut", name: "Грецкий орех", cat: "nuts", price: 780, kcal: 656, p: 16.2, f: 60.8, c: 11.1, yield: "none", allergens: ["орехи"] }),
  make({ id: "oil-sun", name: "Масло подсолнечное", cat: "oils", unit: "liter", density: 0.92, price: 160, kcal: 899, p: 0, f: 99.9, c: 0, yield: "none" }),
  make({ id: "oil-olive", name: "Масло оливковое", cat: "oils", unit: "liter", density: 0.91, price: 890, kcal: 898, p: 0, f: 99.8, c: 0, yield: "none" }),
  make({ id: "mayo", name: "Майонез 67%", cat: "oils", density: 0.95, price: 220, kcal: 627, p: 3.1, f: 67.0, c: 2.6, yield: "none", allergens: ["яйца", "горчица"] }),
  make({ id: "salt", name: "Соль", cat: "spices", unit: "gram", price: 25, kcal: 0, p: 0, f: 0, c: 0, salt: 100, yield: "none" }),
  make({ id: "sugar", name: "Сахар", cat: "sweets", price: 75, kcal: 399, p: 0, f: 0, c: 99.8, sugar: 99.8, yield: "none" }),
  make({ id: "honey", name: "Мёд", cat: "sweets", density: 1.42, price: 520, kcal: 328, p: 0.8, f: 0, c: 80.3, sugar: 80, yield: "none" }),
  make({ id: "jam", name: "Варенье ягодное", cat: "sweets", price: 260, kcal: 271, p: 0.3, f: 0.1, c: 67.0, sugar: 60, yield: "none" }),
  make({ id: "cocoa", name: "Какао-порошок", cat: "sweets", price: 480, kcal: 289, p: 24.3, f: 15.0, c: 10.2, yield: "none" }),
  make({ id: "pepper-black", name: "Перец чёрный", cat: "spices", unit: "gram", price: 1400, kcal: 251, p: 10.4, f: 3.3, c: 38.3, yield: "none" }),
  make({ id: "bay", name: "Лавровый лист", cat: "spices", unit: "gram", price: 1800, kcal: 313, p: 7.6, f: 8.4, c: 48.7, yield: "none" }),
  make({ id: "tomato-paste", name: "Томатная паста", cat: "canned", density: 1.1, price: 190, kcal: 80, p: 4.3, f: 0.5, c: 14.0, yield: "none" }),
  make({ id: "peas-can", name: "Горошек зелёный консерв.", cat: "canned", price: 180, kcal: 55, p: 3.6, f: 0.1, c: 9.8, yield: "none" }),
  make({ id: "corn-can", name: "Кукуруза консервированная", cat: "canned", price: 190, kcal: 58, p: 2.2, f: 0.4, c: 11.2, yield: "none" }),
  make({ id: "beans-can", name: "Фасоль консервированная", cat: "canned", price: 170, kcal: 99, p: 6.7, f: 0.3, c: 17.4, yield: "none" }),
  make({ id: "water", name: "Вода питьевая", cat: "drinks", unit: "liter", density: 1.0, price: 3, kcal: 0, p: 0, f: 0, c: 0, yield: "none" }),
  make({ id: "tea", name: "Чай чёрный", cat: "drinks", unit: "gram", price: 1200, kcal: 151, p: 20.0, f: 5.1, c: 6.9, yield: "none" }),
  make({ id: "coffee", name: "Кофе молотый", cat: "drinks", unit: "gram", price: 1600, kcal: 201, p: 13.9, f: 14.4, c: 4.1, yield: "none" }),
  make({ id: "compote-base", name: "Сухофрукты для компота", cat: "fruits", price: 280, kcal: 215, p: 2.3, f: 0.6, c: 54.0, yield: "none" }),
  make({ id: "yeast", name: "Дрожжи сухие", cat: "other", unit: "gram", price: 900, kcal: 325, p: 40.4, f: 7.6, c: 41.2, yield: "none" }),
  make({ id: "vinegar", name: "Уксус 9%", cat: "other", unit: "milliliter", density: 1.01, price: 70, kcal: 11, p: 0, f: 0, c: 0.6, yield: "none" }),
  make({ id: "mustard", name: "Горчица", cat: "spices", price: 180, kcal: 162, p: 5.7, f: 6.4, c: 22.0, yield: "none", allergens: ["горчица"] }),
];
