import type {
  ColdProcess,
  DishCategory,
  HotProcess,
  LineGroup,
  MealKind,
  ProductCategory,
  RouteId,
} from "../types/models";

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  vegetables: "Овощи",
  fruits: "Фрукты",
  berries: "Ягоды",
  greens: "Зелень",
  mushrooms: "Грибы",
  meat: "Мясо",
  poultry: "Птица",
  fish: "Рыба",
  seafood: "Морепродукты",
  dairy: "Молочка",
  eggs: "Яйца",
  groats: "Крупы",
  flour: "Мука",
  pasta: "Макароны",
  bakery: "Выпечка",
  legumes: "Бобовые",
  nuts: "Орехи",
  oils: "Масла",
  spices: "Специи",
  sweets: "Сладости",
  drinks: "Напитки",
  canned: "Консервы",
  semi_finished: "Полуфабрикаты",
  other: "Прочее",
};

export const DISH_CATEGORY_LABEL: Record<DishCategory, string> = {
  soup: "Супы",
  salad: "Салаты",
  appetizer: "Закуски",
  main: "Горячее",
  side: "Гарниры",
  sauce: "Соусы",
  drink: "Напитки",
  bakery: "Выпечка",
  dessert: "Десерты",
  breakfast: "Завтраки",
  semi_finished: "Полуфабрикаты",
  other: "Прочее",
};

export const COLD_LABEL: Record<ColdProcess, string> = {
  none: "без холодной обработки",
  peel: "очистка / чистка",
  trim: "зачистка / обрезка",
  bone: "обвалка",
  scale: "снятие чешуи",
  gut: "потрошение",
  defrost: "разморозка",
  soak: "замачивание",
  custom: "свой коэффициент",
};

export const HOT_LABEL: Record<HotProcess, string> = {
  none: "без тепловой обработки",
  boil: "варка",
  steam: "на пару",
  stew: "тушение",
  fry: "жарка",
  deep_fry: "во фритюре",
  bake: "запекание",
  grill: "гриль",
  blanch: "бланширование",
  saute: "пассерование",
  custom: "свой коэффициент",
};

export const GROUP_LABEL: Record<LineGroup, string> = {
  main: "Основа",
  garnish: "Гарнир",
  sauce: "Соус",
  dressing: "Заправка",
  broth: "Бульон / жидкость",
  garnish_extra: "Дополнение",
  decor: "Подача",
};

export const MEAL_LABEL: Record<MealKind, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  snack: "Полдник",
  dinner: "Ужин",
  supper: "Поздний ужин",
  banquet: "Банкет",
  custom: "Своё",
};

export const ROUTE_META: Record<RouteId, { title: string; hint: string }> = {
  today: { title: "Сегодня", hint: "сводка кухни" },
  products: { title: "Продукты", hint: "справочник сырья" },
  dishes: { title: "Блюда", hint: "техкарты и закладка" },
  calculator: { title: "Калькулятор", hint: "вес и порции" },
  menus: { title: "Меню", hint: "раскладка на дни" },
  shopping: { title: "Закупки", hint: "сводка по продуктам" },
  techcards: { title: "Техкарты", hint: "печать и расчёт" },
  stock: { title: "Склад", hint: "остатки" },
  reports: { title: "Отчёты", hint: "КБЖУ и потери" },
  settings: { title: "Настройки", hint: "цены и движок" },
};

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[];
export const DISH_CATEGORIES = Object.keys(DISH_CATEGORY_LABEL) as DishCategory[];
export const COLD_PROCESSES = Object.keys(COLD_LABEL) as ColdProcess[];
export const HOT_PROCESSES = Object.keys(HOT_LABEL) as HotProcess[];
export const LINE_GROUPS = Object.keys(GROUP_LABEL) as LineGroup[];
export const MEAL_KINDS = Object.keys(MEAL_LABEL) as MealKind[];
