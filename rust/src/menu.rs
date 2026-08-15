use serde::{Deserialize, Serialize};

use crate::calc::{calc_dish, DishCalc};
use crate::dish::DishBook;
use crate::error::{Error, Result};
use crate::nutrition::Nutrition;
use crate::product::ProductCatalog;
use crate::quantity::WeightTriple;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MealKind {
    Breakfast,
    Lunch,
    Snack,
    Dinner,
    Supper,
    Banquet,
    Custom,
}

impl MealKind {
    pub fn label(self) -> &'static str {
        match self {
            MealKind::Breakfast => "Завтрак",
            MealKind::Lunch => "Обед",
            MealKind::Snack => "Полдник",
            MealKind::Dinner => "Ужин",
            MealKind::Supper => "Поздний ужин",
            MealKind::Banquet => "Банкет",
            MealKind::Custom => "Своё",
        }
    }

    pub fn all() -> &'static [MealKind] {
        &[
            MealKind::Breakfast,
            MealKind::Lunch,
            MealKind::Snack,
            MealKind::Dinner,
            MealKind::Supper,
            MealKind::Banquet,
            MealKind::Custom,
        ]
    }
}

impl Default for MealKind {
    fn default() -> Self {
        MealKind::Lunch
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuSlot {
    pub id: String,
    pub dish_id: String,
    pub portions: f64,
    #[serde(default)]
    pub meal: MealKind,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuDay {
    pub id: String,
    /// ISO-дата YYYY-MM-DD или произвольная метка («Понедельник»).
    pub date_label: String,
    #[serde(default)]
    pub slots: Vec<MenuSlot>,
    #[serde(default)]
    pub guests_override: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Menu {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub period_from: Option<String>,
    #[serde(default)]
    pub period_to: Option<String>,
    /// Гостей по умолчанию на день, если у дня нет своего числа.
    #[serde(default = "default_guests")]
    pub guests: f64,
    #[serde(default)]
    pub days: Vec<MenuDay>,
    #[serde(default)]
    pub venue: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub archived: bool,
}

fn default_guests() -> f64 {
    1.0
}

impl Menu {
    pub fn validate(&self) -> Result<()> {
        if self.id.trim().is_empty() {
            return Err(Error::Validation("у меню пустой id".into()));
        }
        if self.name.trim().is_empty() {
            return Err(Error::Validation("у меню пустое имя".into()));
        }
        if self.guests <= 0.0 {
            return Err(Error::InvalidPortions(self.guests));
        }
        for day in &self.days {
            for slot in &day.slots {
                if slot.portions <= 0.0 {
                    return Err(Error::InvalidPortions(slot.portions));
                }
            }
        }
        Ok(())
    }

    pub fn guests_for(&self, day: &MenuDay) -> f64 {
        day.guests_override.unwrap_or(self.guests)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlotCalc {
    pub slot: MenuSlot,
    pub dish_name: String,
    pub calc: DishCalc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayCalc {
    pub day_id: String,
    pub date_label: String,
    pub guests: f64,
    pub slots: Vec<SlotCalc>,
    pub totals: WeightTriple,
    pub finished_yield_g: f64,
    pub nutrition: Nutrition,
    pub cost: f64,
    pub per_guest_yield_g: f64,
    pub per_guest_nutrition: Nutrition,
    pub per_guest_cost: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuCalc {
    pub menu_id: String,
    pub menu_name: String,
    pub days: Vec<DayCalc>,
    pub totals: WeightTriple,
    pub finished_yield_g: f64,
    pub nutrition: Nutrition,
    pub cost: f64,
    pub dish_count: usize,
    pub slot_count: usize,
    pub warnings: Vec<String>,
}

pub fn calc_menu(menu: &Menu, dishes: &DishBook, catalog: &ProductCatalog) -> Result<MenuCalc> {
    menu.validate()?;
    let mut days = Vec::new();
    let mut totals = WeightTriple::zero();
    let mut finished = 0.0;
    let mut nutrition = Nutrition::zero();
    let mut cost = 0.0;
    let mut slot_count = 0;
    let mut warnings = Vec::new();
    let mut dish_ids = Vec::new();

    for day in &menu.days {
        let mut day_slots = Vec::new();
        let mut day_totals = WeightTriple::zero();
        let mut day_finished = 0.0;
        let mut day_nutrition = Nutrition::zero();
        let mut day_cost = 0.0;
        let guests = menu.guests_for(day);

        for slot in &day.slots {
            let dish = dishes.get(&slot.dish_id)?;
            let calc = calc_dish(dish, catalog, slot.portions)?;
            day_totals = day_totals.add(calc.totals);
            day_finished += calc.finished_yield_g;
            day_nutrition = day_nutrition.add(calc.nutrition_total);
            day_cost += calc.cost_total;
            warnings.extend(calc.warnings.iter().cloned());
            if !dish_ids.iter().any(|id| id == &dish.id) {
                dish_ids.push(dish.id.clone());
            }
            day_slots.push(SlotCalc {
                slot: slot.clone(),
                dish_name: dish.name.clone(),
                calc,
            });
            slot_count += 1;
        }

        totals = totals.add(day_totals);
        finished += day_finished;
        nutrition = nutrition.add(day_nutrition);
        cost += day_cost;

        days.push(DayCalc {
            day_id: day.id.clone(),
            date_label: day.date_label.clone(),
            guests,
            slots: day_slots,
            totals: day_totals,
            finished_yield_g: day_finished,
            nutrition: day_nutrition,
            cost: day_cost,
            per_guest_yield_g: if guests > 0.0 {
                day_finished / guests
            } else {
                0.0
            },
            per_guest_nutrition: if guests > 0.0 {
                day_nutrition.scale(1.0 / guests)
            } else {
                Nutrition::zero()
            },
            per_guest_cost: if guests > 0.0 { day_cost / guests } else { 0.0 },
        });
    }

    Ok(MenuCalc {
        menu_id: menu.id.clone(),
        menu_name: menu.name.clone(),
        days,
        totals,
        finished_yield_g: finished,
        nutrition,
        cost,
        dish_count: dish_ids.len(),
        slot_count,
        warnings,
    })
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MenuBook {
    pub menus: Vec<Menu>,
}

impl MenuBook {
    pub fn get(&self, id: &str) -> Result<&Menu> {
        self.menus
            .iter()
            .find(|m| m.id == id)
            .ok_or_else(|| Error::MenuNotFound(id.to_string()))
    }

    pub fn upsert(&mut self, menu: Menu) {
        if let Some(existing) = self.menus.iter_mut().find(|m| m.id == menu.id) {
            *existing = menu;
        } else {
            self.menus.push(menu);
        }
    }

    pub fn remove(&mut self, id: &str) -> Result<Menu> {
        let idx = self
            .menus
            .iter()
            .position(|m| m.id == id)
            .ok_or_else(|| Error::MenuNotFound(id.to_string()))?;
        Ok(self.menus.remove(idx))
    }
}
