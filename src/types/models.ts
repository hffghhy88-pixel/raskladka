export type Unit =
  | "milligram"
  | "gram"
  | "kilogram"
  | "milliliter"
  | "liter"
  | "teaspoon"
  | "tablespoon"
  | "cup"
  | "glass"
  | "piece"
  | "bunch"
  | "clove"
  | "pinch"
  | "head"
  | "slice"
  | "packet"
  | "can"
  | "portion";

export type UnitFamily = "mass" | "volume" | "count" | "portion";

export type ProductCategory =
  | "vegetables"
  | "fruits"
  | "berries"
  | "greens"
  | "mushrooms"
  | "meat"
  | "poultry"
  | "fish"
  | "seafood"
  | "dairy"
  | "eggs"
  | "groats"
  | "flour"
  | "pasta"
  | "bakery"
  | "legumes"
  | "nuts"
  | "oils"
  | "spices"
  | "sweets"
  | "drinks"
  | "canned"
  | "semi_finished"
  | "other";

export type DishCategory =
  | "soup"
  | "salad"
  | "appetizer"
  | "main"
  | "side"
  | "sauce"
  | "drink"
  | "bakery"
  | "dessert"
  | "breakfast"
  | "semi_finished"
  | "other";

export type ColdProcess =
  | "none"
  | "peel"
  | "trim"
  | "bone"
  | "scale"
  | "gut"
  | "defrost"
  | "soak"
  | "custom";

export type HotProcess =
  | "none"
  | "boil"
  | "steam"
  | "stew"
  | "fry"
  | "deep_fry"
  | "bake"
  | "grill"
  | "blanch"
  | "saute"
  | "custom";

export type LineGroup =
  | "main"
  | "garnish"
  | "sauce"
  | "dressing"
  | "broth"
  | "garnish_extra"
  | "decor";

export type MealKind =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "supper"
  | "banquet"
  | "custom";

export type YieldKind =
  | "none"
  | "root"
  | "onion"
  | "cabbage"
  | "greens"
  | "meat"
  | "poultry"
  | "fish"
  | "groats"
  | "pasta"
  | "dairy";

export interface Nutrition {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  sugarG: number;
  saltG: number;
}

export interface ColdLossTable {
  peel: number;
  trim: number;
  bone: number;
  scale: number;
  gut: number;
  defrost: number;
  soak: number;
  custom: number;
}

export interface HotYieldTable {
  boil: number;
  steam: number;
  stew: number;
  fry: number;
  deepFry: number;
  bake: number;
  grill: number;
  blanch: number;
  saute: number;
  custom: number;
}

export interface YieldProfile {
  coldLoss: ColdLossTable;
  hotYield: HotYieldTable;
}

export interface Product {
  id: string;
  name: string;
  nameGenitive?: string;
  category: ProductCategory;
  subcategory?: string;
  defaultUnit: Unit;
  densityGPerMl?: number;
  pieceWeightG?: number;
  yieldProfile: YieldProfile;
  nutritionPer100g: Nutrition;
  allergens: string[];
  pricePerKg: number;
  supplier?: string;
  notes?: string;
  isSemiFinished: boolean;
  sourceDishId?: string;
  storageDays?: number;
  seasonMonths: number[];
  archived: boolean;
}

export interface DishLine {
  id: string;
  productId: string;
  quantity: number;
  unit: Unit;
  cold: ColdProcess;
  hot: HotProcess;
  coldLossOverride?: number;
  hotYieldOverride?: number;
  group: LineGroup;
  note?: string;
  optional: boolean;
  excludeFromYield: boolean;
  excludeFromShopping: boolean;
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  basePortions: number;
  targetPortionG: number;
  lines: DishLine[];
  steps: string[];
  description?: string;
  cookTimeMin: number;
  prepTimeMin: number;
  difficulty: number;
  tags: string[];
  cuisine?: string;
  finishingLossPercent: number;
  evaporationG: number;
  archived: boolean;
}

export interface MenuSlot {
  id: string;
  dishId: string;
  portions: number;
  meal: MealKind;
  note?: string;
}

export interface MenuDay {
  id: string;
  dateLabel: string;
  slots: MenuSlot[];
  guestsOverride?: number;
}

export interface Menu {
  id: string;
  name: string;
  periodFrom?: string;
  periodTo?: string;
  guests: number;
  days: MenuDay[];
  venue?: string;
  notes?: string;
  archived: boolean;
}

export interface StockItem {
  productId: string;
  quantityG: number;
  reservedG: number;
  minG: number;
  location?: string;
}

export interface CostSettings {
  markupPercent: number;
  overheadPercent: number;
  vatPercent: number;
}

export interface Workspace {
  title: string;
  products: Product[];
  dishes: Dish[];
  menus: Menu[];
  inventory: StockItem[];
  cost: CostSettings;
  updatedAt: string;
}

export interface WeightTriple {
  grossG: number;
  netG: number;
  yieldG: number;
}

export interface LineCalc {
  lineId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: Unit;
  weights: WeightTriple;
  cold: ColdProcess;
  hot: HotProcess;
  coldLossPercent: number;
  hotYieldPercent: number;
  nutrition: Nutrition;
  cost: number;
  excludeFromYield: boolean;
  optional: boolean;
  group: LineGroup;
  note?: string;
}

export interface DishCalc {
  dishId: string;
  dishName: string;
  portions: number;
  scaleFactor: number;
  lines: LineCalc[];
  totals: WeightTriple;
  finishedYieldG: number;
  portionYieldG: number;
  targetPortionG: number;
  portionDeltaG: number;
  nutritionTotal: Nutrition;
  nutritionPerPortion: Nutrition;
  costTotal: number;
  costPerPortion: number;
  finishingLossG: number;
  evaporationG: number;
  warnings: string[];
}

export interface SlotCalc {
  slot: MenuSlot;
  dishName: string;
  calc: DishCalc;
}

export interface DayCalc {
  dayId: string;
  dateLabel: string;
  guests: number;
  slots: SlotCalc[];
  totals: WeightTriple;
  finishedYieldG: number;
  nutrition: Nutrition;
  cost: number;
  perGuestYieldG: number;
  perGuestNutrition: Nutrition;
  perGuestCost: number;
}

export interface MenuCalc {
  menuId: string;
  menuName: string;
  days: DayCalc[];
  totals: WeightTriple;
  finishedYieldG: number;
  nutrition: Nutrition;
  cost: number;
  dishCount: number;
  slotCount: number;
  warnings: string[];
}

export interface ShoppingItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  grossG: number;
  netG: number;
  yieldG: number;
  cost: number;
  defaultUnit: Unit;
  displayQty: number;
  displayUnit: Unit;
  displayLabel: string;
  usedIn: string[];
  inStockG: number;
  toBuyG: number;
}

export interface ShoppingCategoryGroup {
  category: ProductCategory;
  label: string;
  grossG: number;
  cost: number;
  count: number;
}

export interface ShoppingList {
  items: ShoppingItem[];
  totalGrossG: number;
  totalCost: number;
  categories: ShoppingCategoryGroup[];
}

export interface CostLine {
  productName: string;
  grossG: number;
  pricePerKg: number;
  cost: number;
  sharePercent: number;
}

export interface CostCard {
  dishName: string;
  portions: number;
  lines: CostLine[];
  foodCost: number;
  markupPercent: number;
  overheadPercent: number;
  vatPercent: number;
  foodCostPerPortion: number;
  priceExVat: number;
  priceIncVat: number;
  margin: number;
  foodCostRatio: number;
}

export interface TechCardLine {
  index: number;
  productName: string;
  unit: string;
  quantity: string;
  grossG: string;
  netG: string;
  yieldG: string;
  cold: string;
  hot: string;
  note: string;
}

export interface TechCard {
  title: string;
  dishId: string;
  portions: number;
  cookTimeMin: number;
  prepTimeMin: number;
  category: string;
  description: string;
  lines: TechCardLine[];
  steps: string[];
  grossTotal: string;
  netTotal: string;
  yieldTotal: string;
  finishedYield: string;
  portionYield: string;
  targetPortion: string;
  nutritionPerPortion: string;
  costPerPortion: string;
  allergens: string[];
  warnings: string[];
}

export interface SearchHit {
  kind: "product" | "dish" | "menu";
  id: string;
  title: string;
  subtitle: string;
  score: number;
}

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export type RouteId =
  | "today"
  | "products"
  | "dishes"
  | "calculator"
  | "menus"
  | "shopping"
  | "techcards"
  | "stock"
  | "reports"
  | "settings";
