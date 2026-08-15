import type { Dish, Menu, Product, ValidationReport } from "../types/models";

export function validateWorkspace(products: Product[], dishes: Dish[], menus: Menu[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const productIds = new Set<string>();
  const dishIds = new Set<string>();
  const menuIds = new Set<string>();

  for (const product of products) {
    if (productIds.has(product.id)) errors.push(`дублируется продукт ${product.id}`);
    productIds.add(product.id);
    if (!product.name.trim()) errors.push(`у продукта ${product.id} пустое имя`);
    if (product.pricePerKg === 0) warnings.push(`у «${product.name}» нет цены`);
    if (product.nutritionPer100g.kcal === 0 && product.category !== "spices") {
      warnings.push(`у «${product.name}» не заполнена пищевая ценность`);
    }
  }

  for (const dish of dishes) {
    if (dishIds.has(dish.id)) errors.push(`дублируется блюдо ${dish.id}`);
    dishIds.add(dish.id);
    if (!dish.name.trim()) errors.push(`у блюда ${dish.id} пустое имя`);
    if (dish.lines.length === 0) errors.push(`блюдо «${dish.name}» без продуктов`);
    if (dish.basePortions <= 0) errors.push(`у «${dish.name}» некорректные порции`);
    for (const line of dish.lines) {
      if (!productIds.has(line.productId)) {
        errors.push(`блюдо «${dish.name}»: продукт ${line.productId} не найден`);
      }
    }
    if (dish.targetPortionG === 0) warnings.push(`у «${dish.name}» нет планового выхода порции`);
  }

  for (const menu of menus) {
    if (menuIds.has(menu.id)) errors.push(`дублируется меню ${menu.id}`);
    menuIds.add(menu.id);
    if (menu.guests <= 0) errors.push(`у меню «${menu.name}» некорректное число гостей`);
    for (const day of menu.days) {
      for (const slot of day.slots) {
        if (!dishIds.has(slot.dishId)) {
          errors.push(`меню «${menu.name}», ${day.dateLabel}: блюдо ${slot.dishId} не найдено`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
