use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::calc::calc_dish;
use crate::dish::DishBook;
use crate::error::Result;
use crate::menu::{MealKind, Menu, MenuDay};
use crate::product::ProductCatalog;
use crate::units;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductionTask {
    pub dish_id: String,
    pub dish_name: String,
    pub meal: MealKind,
    pub portions: f64,
    pub start_batch_g: f64,
    pub finished_g: f64,
    pub cook_time_min: u32,
    pub prep_time_min: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductionPlan {
    pub date_label: String,
    pub guests: f64,
    pub tasks: Vec<ProductionTask>,
    pub total_prep_min: u32,
    pub total_cook_min: u32,
    pub total_finished_g: f64,
    pub by_station: Vec<StationLoad>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StationLoad {
    pub station: String,
    pub dishes: usize,
    pub finished_g: f64,
    pub minutes: u32,
}

pub fn plan_day(
    menu: &Menu,
    day: &MenuDay,
    dishes: &DishBook,
    catalog: &ProductCatalog,
) -> Result<ProductionPlan> {
    let mut tasks = Vec::new();
    let mut prep = 0u32;
    let mut cook = 0u32;
    let mut finished = 0.0;
    let mut stations: BTreeMap<String, StationLoad> = BTreeMap::new();

    for slot in &day.slots {
        let dish = dishes.get(&slot.dish_id)?;
        let calc = calc_dish(dish, catalog, slot.portions)?;
        let station = station_for(dish.category);
        let entry = stations.entry(station.to_string()).or_insert(StationLoad {
            station: station.to_string(),
            dishes: 0,
            finished_g: 0.0,
            minutes: 0,
        });
        entry.dishes += 1;
        entry.finished_g += calc.finished_yield_g;
        entry.minutes += dish.prep_time_min + dish.cook_time_min;
        prep += dish.prep_time_min;
        cook += dish.cook_time_min;
        finished += calc.finished_yield_g;
        tasks.push(ProductionTask {
            dish_id: dish.id.clone(),
            dish_name: dish.name.clone(),
            meal: slot.meal,
            portions: slot.portions,
            start_batch_g: calc.totals.gross_g,
            finished_g: calc.finished_yield_g,
            cook_time_min: dish.cook_time_min,
            prep_time_min: dish.prep_time_min,
        });
    }

    tasks.sort_by(|a, b| {
        meal_order(a.meal)
            .cmp(&meal_order(b.meal))
            .then(a.dish_name.cmp(&b.dish_name))
    });

    Ok(ProductionPlan {
        date_label: day.date_label.clone(),
        guests: menu.guests_for(day),
        tasks,
        total_prep_min: prep,
        total_cook_min: cook,
        total_finished_g: finished,
        by_station: stations.into_values().collect(),
    })
}

fn station_for(category: crate::dish::DishCategory) -> &'static str {
    use crate::dish::DishCategory::*;
    match category {
        Soup => "Суповой",
        Salad | Appetizer => "Холодный цех",
        Main => "Горячий цех",
        Side => "Гарнирный",
        Sauce => "Соусный",
        Drink => "Напитки",
        Bakery | Dessert => "Мучной / сладкий",
        Breakfast => "Завтраки",
        SemiFinished => "Заготовка",
        Other => "Общий",
    }
}

fn meal_order(meal: MealKind) -> u8 {
    match meal {
        MealKind::Breakfast => 0,
        MealKind::Lunch => 1,
        MealKind::Snack => 2,
        MealKind::Dinner => 3,
        MealKind::Supper => 4,
        MealKind::Banquet => 5,
        MealKind::Custom => 6,
    }
}

pub fn plan_text(plan: &ProductionPlan) -> String {
    let mut out = format!(
        "Производство · {} · гостей {:.0} · выход {}\n",
        plan.date_label,
        plan.guests,
        units::format_mass_grams(plan.total_finished_g)
    );
    for task in &plan.tasks {
        out.push_str(&format!(
            "• {} — {:.0} порц., закладка {}, выход {}, {} мин\n",
            task.dish_name,
            task.portions,
            units::format_mass_grams(task.start_batch_g),
            units::format_mass_grams(task.finished_g),
            task.prep_time_min + task.cook_time_min
        ));
    }
    out
}
