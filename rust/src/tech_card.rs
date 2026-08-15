use serde::{Deserialize, Serialize};

use crate::calc::{calc_dish, DishCalc, LineCalc};
use crate::dish::Dish;
use crate::error::Result;
use crate::product::ProductCatalog;
use crate::units;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechCardLine {
    pub index: usize,
    pub product_name: String,
    pub unit: String,
    pub quantity: String,
    pub gross_g: String,
    pub net_g: String,
    pub yield_g: String,
    pub cold: String,
    pub hot: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechCard {
    pub title: String,
    pub dish_id: String,
    pub portions: f64,
    pub cook_time_min: u32,
    pub prep_time_min: u32,
    pub category: String,
    pub description: String,
    pub lines: Vec<TechCardLine>,
    pub steps: Vec<String>,
    pub gross_total: String,
    pub net_total: String,
    pub yield_total: String,
    pub finished_yield: String,
    pub portion_yield: String,
    pub target_portion: String,
    pub nutrition_per_portion: String,
    pub cost_per_portion: String,
    pub allergens: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn tech_card(dish: &Dish, catalog: &ProductCatalog, portions: f64) -> Result<TechCard> {
    let calc = calc_dish(dish, catalog, portions)?;
    Ok(render_tech_card(dish, catalog, &calc))
}

pub fn render_tech_card(dish: &Dish, catalog: &ProductCatalog, calc: &DishCalc) -> TechCard {
    let mut allergens = Vec::new();
    let lines = calc
        .lines
        .iter()
        .enumerate()
        .map(|(i, line)| {
            if let Ok(product) = catalog.get(&line.product_id) {
                for a in &product.allergens {
                    if !allergens.iter().any(|x| x == a) {
                        allergens.push(a.clone());
                    }
                }
            }
            render_line(i + 1, line)
        })
        .collect();

    let n = calc.nutrition_per_portion.rounded();
    TechCard {
        title: dish.name.clone(),
        dish_id: dish.id.clone(),
        portions: calc.portions,
        cook_time_min: dish.cook_time_min,
        prep_time_min: dish.prep_time_min,
        category: dish.category.label().to_string(),
        description: dish.description.clone().unwrap_or_default(),
        lines,
        steps: dish.steps.clone(),
        gross_total: units::format_mass_grams(calc.totals.gross_g),
        net_total: units::format_mass_grams(calc.totals.net_g),
        yield_total: units::format_mass_grams(calc.totals.yield_g),
        finished_yield: units::format_mass_grams(calc.finished_yield_g),
        portion_yield: units::format_mass_grams(calc.portion_yield_g),
        target_portion: if dish.target_portion_g > 0.0 {
            units::format_mass_grams(dish.target_portion_g)
        } else {
            "по факту".into()
        },
        nutrition_per_portion: format!(
            "{:.0} ккал · Б {:.1} · Ж {:.1} · У {:.1}",
            n.kcal, n.protein_g, n.fat_g, n.carbs_g
        ),
        cost_per_portion: format!("{:.2} ₽", calc.cost_per_portion),
        allergens,
        warnings: calc.warnings.clone(),
    }
}

fn render_line(index: usize, line: &LineCalc) -> TechCardLine {
    TechCardLine {
        index,
        product_name: line.product_name.clone(),
        unit: line.unit.code().to_string(),
        quantity: units::format_ru(line.quantity, 2, line.unit.code()),
        gross_g: units::format_mass_grams(line.weights.gross_g),
        net_g: units::format_mass_grams(line.weights.net_g),
        yield_g: units::format_mass_grams(line.weights.yield_g),
        cold: line.cold.label().to_string(),
        hot: line.hot.label().to_string(),
        note: line.note.clone().unwrap_or_default(),
    }
}

pub fn tech_card_markdown(card: &TechCard) -> String {
    let mut out = String::new();
    out.push_str(&format!("# Технологическая карта\n\n**{}**\n\n", card.title));
    out.push_str(&format!(
        "Категория: {} · Порций: {:.0} · Подготовка: {} мин · Приготовление: {} мин\n\n",
        card.category, card.portions, card.prep_time_min, card.cook_time_min
    ));
    if !card.description.is_empty() {
        out.push_str(&format!("{}\n\n", card.description));
    }
    out.push_str("| № | Продукт | Кол-во | Брутто | Нетто | Выход | Холод. | Тепл. |\n");
    out.push_str("|---|---|---:|---:|---:|---:|---|---|\n");
    for line in &card.lines {
        out.push_str(&format!(
            "| {} | {} | {} | {} | {} | {} | {} | {} |\n",
            line.index,
            line.product_name,
            line.quantity,
            line.gross_g,
            line.net_g,
            line.yield_g,
            line.cold,
            line.hot
        ));
    }
    out.push_str(&format!(
        "\n**Итого брутто:** {} · **нетто:** {} · **выход сырья:** {} · **выход блюда:** {} · **порция:** {}\n\n",
        card.gross_total, card.net_total, card.yield_total, card.finished_yield, card.portion_yield
    ));
    out.push_str(&format!(
        "Пищевая ценность порции: {} · себестоимость: {}\n\n",
        card.nutrition_per_portion, card.cost_per_portion
    ));
    if !card.steps.is_empty() {
        out.push_str("## Технология\n\n");
        for (i, step) in card.steps.iter().enumerate() {
            out.push_str(&format!("{}. {}\n", i + 1, step));
        }
        out.push('\n');
    }
    if !card.allergens.is_empty() {
        out.push_str(&format!("Аллергены: {}\n", card.allergens.join(", ")));
    }
    out
}
