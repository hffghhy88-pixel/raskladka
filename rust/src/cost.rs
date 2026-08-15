use serde::{Deserialize, Serialize};

use crate::calc::{calc_dish, DishCalc};
use crate::dish::Dish;
use crate::error::Result;
use crate::product::ProductCatalog;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostLine {
    pub product_name: String,
    pub gross_g: f64,
    pub price_per_kg: f64,
    pub cost: f64,
    pub share_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostCard {
    pub dish_name: String,
    pub portions: f64,
    pub lines: Vec<CostLine>,
    pub food_cost: f64,
    pub markup_percent: f64,
    pub overhead_percent: f64,
    pub vat_percent: f64,
    pub food_cost_per_portion: f64,
    pub price_ex_vat: f64,
    pub price_inc_vat: f64,
    pub margin: f64,
    pub food_cost_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostSettings {
    #[serde(default = "default_markup")]
    pub markup_percent: f64,
    #[serde(default)]
    pub overhead_percent: f64,
    #[serde(default)]
    pub vat_percent: f64,
}

fn default_markup() -> f64 {
    250.0
}

impl Default for CostSettings {
    fn default() -> Self {
        Self {
            markup_percent: 250.0,
            overhead_percent: 15.0,
            vat_percent: 0.0,
        }
    }
}

pub fn cost_card(dish: &Dish, catalog: &ProductCatalog, portions: f64, settings: &CostSettings) -> Result<CostCard> {
    let calc = calc_dish(dish, catalog, portions)?;
    Ok(cost_card_from_calc(&calc, catalog, settings))
}

pub fn cost_card_from_calc(
    calc: &DishCalc,
    catalog: &ProductCatalog,
    settings: &CostSettings,
) -> CostCard {
    let food = calc.cost_total.max(0.0);
    let mut lines: Vec<CostLine> = calc
        .lines
        .iter()
        .map(|line| {
            let price = catalog
                .get(&line.product_id)
                .map(|p| p.price_per_kg)
                .unwrap_or(0.0);
            CostLine {
                product_name: line.product_name.clone(),
                gross_g: line.weights.gross_g,
                price_per_kg: price,
                cost: line.cost,
                share_percent: if food > 0.0 {
                    line.cost / food * 100.0
                } else {
                    0.0
                },
            }
        })
        .collect();
    lines.sort_by(|a, b| b.cost.partial_cmp(&a.cost).unwrap_or(std::cmp::Ordering::Equal));

    let with_overhead = food * (1.0 + settings.overhead_percent / 100.0);
    let price_ex = with_overhead * (1.0 + settings.markup_percent / 100.0);
    let price_inc = price_ex * (1.0 + settings.vat_percent / 100.0);
    let per = if calc.portions > 0.0 {
        calc.portions
    } else {
        1.0
    };

    CostCard {
        dish_name: calc.dish_name.clone(),
        portions: calc.portions,
        lines,
        food_cost: food,
        markup_percent: settings.markup_percent,
        overhead_percent: settings.overhead_percent,
        vat_percent: settings.vat_percent,
        food_cost_per_portion: food / per,
        price_ex_vat: price_ex / per,
        price_inc_vat: price_inc / per,
        margin: (price_ex - food) / per,
        food_cost_ratio: if price_ex > 0.0 {
            food / price_ex * 100.0
        } else {
            0.0
        },
    }
}
