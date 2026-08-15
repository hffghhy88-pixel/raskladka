use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::calc::calc_dish;
use crate::dish::DishBook;
use crate::error::Result;
use crate::menu::Menu;
use crate::product::{ProductCatalog, ProductCategory};
use crate::units;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShoppingItem {
    pub product_id: String,
    pub product_name: String,
    pub category: ProductCategory,
    pub gross_g: f64,
    pub net_g: f64,
    pub yield_g: f64,
    pub cost: f64,
    pub default_unit: crate::units::Unit,
    pub display_qty: f64,
    pub display_unit: crate::units::Unit,
    pub display_label: String,
    pub used_in: Vec<String>,
    #[serde(default)]
    pub in_stock_g: f64,
    pub to_buy_g: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShoppingList {
    pub items: Vec<ShoppingItem>,
    pub total_gross_g: f64,
    pub total_cost: f64,
    pub categories: Vec<ShoppingCategoryGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShoppingCategoryGroup {
    pub category: ProductCategory,
    pub label: String,
    pub gross_g: f64,
    pub cost: f64,
    pub count: usize,
}

#[derive(Default)]
struct Acc {
    name: String,
    category: ProductCategory,
    gross_g: f64,
    net_g: f64,
    yield_g: f64,
    cost: f64,
    unit: crate::units::Unit,
    density: Option<f64>,
    piece: Option<f64>,
    used_in: Vec<String>,
}

pub fn shopping_from_menu(
    menu: &Menu,
    dishes: &DishBook,
    catalog: &ProductCatalog,
    stock: &BTreeMap<String, f64>,
) -> Result<ShoppingList> {
    let mut acc: BTreeMap<String, Acc> = BTreeMap::new();

    for day in &menu.days {
        for slot in &day.slots {
            let dish = dishes.get(&slot.dish_id)?;
            let calc = calc_dish(dish, catalog, slot.portions)?;
            for line in calc.lines {
                let origin = dish.lines.iter().find(|l| l.id == line.line_id);
                if origin.map(|l| l.exclude_from_shopping).unwrap_or(false) {
                    continue;
                }
                let product = catalog.get(&line.product_id)?;
                let entry = acc.entry(line.product_id.clone()).or_insert_with(|| Acc {
                    name: product.name.clone(),
                    category: product.category,
                    unit: product.default_unit,
                    density: product.density_g_per_ml,
                    piece: product.piece_weight_g,
                    ..Acc::default()
                });
                entry.gross_g += line.weights.gross_g;
                entry.net_g += line.weights.net_g;
                entry.yield_g += line.weights.yield_g;
                entry.cost += line.cost;
                let mark = format!("{} · {}", day.date_label, dish.name);
                if !entry.used_in.contains(&mark) {
                    entry.used_in.push(mark);
                }
            }
        }
    }

    let mut items = Vec::new();
    for (product_id, a) in acc {
        let in_stock = stock.get(&product_id).copied().unwrap_or(0.0);
        let to_buy = (a.gross_g - in_stock).max(0.0);
        let ctx = crate::units::ConversionContext {
            density_g_per_ml: a.density,
            piece_weight_g: a.piece,
            portion_weight_g: None,
        };
        let (display_qty, display_unit) = pretty_qty(a.gross_g, a.unit, ctx);
        items.push(ShoppingItem {
            product_id,
            product_name: a.name,
            category: a.category,
            gross_g: a.gross_g,
            net_g: a.net_g,
            yield_g: a.yield_g,
            cost: a.cost,
            default_unit: a.unit,
            display_qty,
            display_unit,
            display_label: crate::units::format_ru(display_qty, 2, display_unit.code()),
            used_in: a.used_in,
            in_stock_g: in_stock,
            to_buy_g: to_buy,
        });
    }

    items.sort_by(|a, b| {
        let ca = format!("{:?}", a.category);
        let cb = format!("{:?}", b.category);
        ca.cmp(&cb)
            .then(a.product_name.cmp(&b.product_name))
    });

    let total_gross_g = items.iter().map(|i| i.gross_g).sum();
    let total_cost = items.iter().map(|i| i.cost).sum();
    let categories = group_categories(&items);

    Ok(ShoppingList {
        items,
        total_gross_g,
        total_cost,
        categories,
    })
}

fn pretty_qty(
    grams: f64,
    preferred: crate::units::Unit,
    ctx: crate::units::ConversionContext,
) -> (f64, crate::units::Unit) {
    if preferred.is_mass() {
        if grams >= 1000.0 {
            return (grams / 1000.0, crate::units::Unit::Kilogram);
        }
        return (grams, crate::units::Unit::Gram);
    }
    if let Ok(v) = units::from_grams(grams, preferred, ctx) {
        return (v, preferred);
    }
    if grams >= 1000.0 {
        (grams / 1000.0, crate::units::Unit::Kilogram)
    } else {
        (grams, crate::units::Unit::Gram)
    }
}

fn group_categories(items: &[ShoppingItem]) -> Vec<ShoppingCategoryGroup> {
    let mut map: BTreeMap<String, ShoppingCategoryGroup> = BTreeMap::new();
    for item in items {
        let key = format!("{:?}", item.category);
        let entry = map.entry(key).or_insert_with(|| ShoppingCategoryGroup {
            category: item.category,
            label: item.category.label().to_string(),
            gross_g: 0.0,
            cost: 0.0,
            count: 0,
        });
        entry.gross_g += item.gross_g;
        entry.cost += item.cost;
        entry.count += 1;
    }
    map.into_values().collect()
}
