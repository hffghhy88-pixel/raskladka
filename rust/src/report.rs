use serde::{Deserialize, Serialize};

use crate::calc::calc_dish;
use crate::dish::DishBook;
use crate::error::Result;
use crate::menu::{calc_menu, MealKind, Menu};
use crate::nutrition::{DailyNutritionNorm, Nutrition, NutritionCoverage};
use crate::product::ProductCatalog;
use crate::units;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayNutritionReport {
    pub date_label: String,
    pub guests: f64,
    pub nutrition_total: Nutrition,
    pub nutrition_per_guest: Nutrition,
    pub coverage: NutritionCoverage,
    pub yield_per_guest_g: f64,
    pub cost_per_guest: f64,
    pub by_meal: Vec<MealNutrition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MealNutrition {
    pub meal: MealKind,
    pub label: String,
    pub nutrition: Nutrition,
    pub yield_g: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasteReport {
    pub cold_loss_g: f64,
    pub hot_loss_g: f64,
    pub finishing_loss_g: f64,
    pub evaporation_g: f64,
    pub cold_loss_percent: f64,
    pub hot_loss_percent: f64,
    pub comments: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuSummaryReport {
    pub menu_name: String,
    pub days: usize,
    pub dishes: usize,
    pub slots: usize,
    pub gross: String,
    pub net: String,
    pub yield_total: String,
    pub finished: String,
    pub cost: String,
    pub nutrition_days: Vec<DayNutritionReport>,
    pub waste: WasteReport,
}

pub fn menu_summary(
    menu: &Menu,
    dishes: &DishBook,
    catalog: &ProductCatalog,
    norm: DailyNutritionNorm,
) -> Result<MenuSummaryReport> {
    let calc = calc_menu(menu, dishes, catalog)?;
    let mut nutrition_days = Vec::new();
    let mut cold = 0.0;
    let mut hot = 0.0;
    let mut finishing = 0.0;
    let mut evaporation = 0.0;

    for day in &calc.days {
        let mut by_meal: Vec<MealNutrition> = Vec::new();
        for slot in &day.slots {
            let meal = slot.slot.meal;
            if let Some(existing) = by_meal.iter_mut().find(|m| m.meal == meal) {
                existing.nutrition = existing.nutrition.add(slot.calc.nutrition_total);
                existing.yield_g += slot.calc.finished_yield_g;
            } else {
                by_meal.push(MealNutrition {
                    meal,
                    label: meal.label().to_string(),
                    nutrition: slot.calc.nutrition_total,
                    yield_g: slot.calc.finished_yield_g,
                });
            }
            cold += slot.calc.totals.cold_loss_g();
            hot += slot.calc.totals.hot_loss_g();
            finishing += slot.calc.finishing_loss_g;
            evaporation += slot.calc.evaporation_g;
        }
        nutrition_days.push(DayNutritionReport {
            date_label: day.date_label.clone(),
            guests: day.guests,
            nutrition_total: day.nutrition,
            nutrition_per_guest: day.per_guest_nutrition,
            coverage: norm.coverage(day.per_guest_nutrition),
            yield_per_guest_g: day.per_guest_yield_g,
            cost_per_guest: day.per_guest_cost,
            by_meal,
        });
    }

    let gross = calc.totals.gross_g;
    let mut comments = Vec::new();
    if gross > 0.0 && cold / gross > 0.35 {
        comments.push("холодные потери выше 35% — проверьте очистку и обвалку".into());
    }
    if calc.totals.net_g > 0.0 && hot / calc.totals.net_g > 0.4 {
        comments.push("тепловые потери выше 40% — много жарки или сушки".into());
    }

    Ok(MenuSummaryReport {
        menu_name: menu.name.clone(),
        days: calc.days.len(),
        dishes: calc.dish_count,
        slots: calc.slot_count,
        gross: units::format_mass_grams(calc.totals.gross_g),
        net: units::format_mass_grams(calc.totals.net_g),
        yield_total: units::format_mass_grams(calc.totals.yield_g),
        finished: units::format_mass_grams(calc.finished_yield_g),
        cost: format!("{:.2} ₽", calc.cost),
        nutrition_days,
        waste: WasteReport {
            cold_loss_percent: if gross > 0.0 { cold / gross * 100.0 } else { 0.0 },
            hot_loss_percent: if calc.totals.net_g > 0.0 {
                hot / calc.totals.net_g * 100.0
            } else {
                0.0
            },
            cold_loss_g: cold,
            hot_loss_g: hot,
            finishing_loss_g: finishing,
            evaporation_g: evaporation,
            comments,
        },
    })
}

pub fn dish_compare(
    left_id: &str,
    right_id: &str,
    portions: f64,
    dishes: &DishBook,
    catalog: &ProductCatalog,
) -> Result<DishCompareReport> {
    let left = calc_dish(dishes.get(left_id)?, catalog, portions)?;
    let right = calc_dish(dishes.get(right_id)?, catalog, portions)?;
    Ok(DishCompareReport {
        left_name: left.dish_name.clone(),
        right_name: right.dish_name.clone(),
        portions,
        left_portion_g: left.portion_yield_g,
        right_portion_g: right.portion_yield_g,
        left_cost: left.cost_per_portion,
        right_cost: right.cost_per_portion,
        left_kcal: left.nutrition_per_portion.kcal,
        right_kcal: right.nutrition_per_portion.kcal,
        cheaper: if left.cost_per_portion <= right.cost_per_portion {
            left.dish_name.clone()
        } else {
            right.dish_name.clone()
        },
        lighter: if left.portion_yield_g <= right.portion_yield_g {
            left.dish_name.clone()
        } else {
            right.dish_name.clone()
        },
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DishCompareReport {
    pub left_name: String,
    pub right_name: String,
    pub portions: f64,
    pub left_portion_g: f64,
    pub right_portion_g: f64,
    pub left_cost: f64,
    pub right_cost: f64,
    pub left_kcal: f64,
    pub right_kcal: f64,
    pub cheaper: String,
    pub lighter: String,
}
