use serde::{Deserialize, Serialize};

use crate::dish::{Dish, DishLine};
use crate::error::{Error, Result};
use crate::nutrition::Nutrition;
use crate::product::{Product, ProductCatalog};
use crate::quantity::WeightTriple;
use crate::units::{self, Unit};
use crate::yield_table::{ColdProcess, HotProcess};

/// Расчёт одной строки техкарты.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineCalc {
    pub line_id: String,
    pub product_id: String,
    pub product_name: String,
    pub quantity: f64,
    pub unit: Unit,
    pub weights: WeightTriple,
    pub cold: ColdProcess,
    pub hot: HotProcess,
    pub cold_loss_percent: f64,
    pub hot_yield_percent: f64,
    pub nutrition: Nutrition,
    pub cost: f64,
    pub exclude_from_yield: bool,
    pub optional: bool,
    pub group: crate::dish::LineGroup,
    pub note: Option<String>,
}

/// Итог по блюду на заданное число порций.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DishCalc {
    pub dish_id: String,
    pub dish_name: String,
    pub portions: f64,
    pub scale_factor: f64,
    pub lines: Vec<LineCalc>,
    pub totals: WeightTriple,
    /// Выход после технологических потерь и выкипания.
    pub finished_yield_g: f64,
    pub portion_yield_g: f64,
    pub target_portion_g: f64,
    pub portion_delta_g: f64,
    pub nutrition_total: Nutrition,
    pub nutrition_per_portion: Nutrition,
    pub cost_total: f64,
    pub cost_per_portion: f64,
    pub finishing_loss_g: f64,
    pub evaporation_g: f64,
    pub warnings: Vec<String>,
}

pub fn calc_line(line: &DishLine, product: &Product, scale: f64) -> Result<LineCalc> {
    line.validate()?;
    let qty = line.quantity * scale;
    let ctx = product.conversion_context();
    let gross_g = units::to_grams(qty, line.unit, ctx).map_err(|err| match err {
        Error::Conversion { .. } => {
            if line.unit.is_volume() && product.density_g_per_ml.is_none() {
                Error::MissingDensity(product.name.clone())
            } else if line.unit.is_count() && product.piece_weight_g.is_none() {
                Error::MissingPieceWeight(product.name.clone())
            } else {
                err
            }
        }
        other => other,
    })?;

    let cold_pct = line
        .cold_loss_override
        .unwrap_or_else(|| product.cold_loss_percent(line.cold));
    let hot_pct = line
        .hot_yield_override
        .unwrap_or_else(|| product.hot_yield_percent(line.hot));

    if !(0.0..=95.0).contains(&cold_pct) {
        return Err(Error::InvalidYield(cold_pct));
    }
    if !(10.0..=400.0).contains(&hot_pct) {
        return Err(Error::InvalidYield(hot_pct));
    }

    let net_g = gross_g * (1.0 - cold_pct / 100.0);
    let yield_g = net_g * (hot_pct / 100.0);
    let weights = WeightTriple {
        gross_g,
        net_g,
        yield_g,
    };

    // КБЖУ считаем по нетто (съедобная часть до тепловой потери воды/жира).
    let nutrition = product.nutrition_per_100g.for_grams(net_g);
    let cost = (gross_g / 1000.0) * product.price_per_kg;

    Ok(LineCalc {
        line_id: line.id.clone(),
        product_id: product.id.clone(),
        product_name: product.name.clone(),
        quantity: qty,
        unit: line.unit,
        weights,
        cold: line.cold,
        hot: line.hot,
        cold_loss_percent: cold_pct,
        hot_yield_percent: hot_pct,
        nutrition,
        cost,
        exclude_from_yield: line.exclude_from_yield,
        optional: line.optional,
        group: line.group,
        note: line.note.clone(),
    })
}

pub fn calc_dish(dish: &Dish, catalog: &ProductCatalog, portions: f64) -> Result<DishCalc> {
    dish.validate()?;
    let scale = dish.scale_factor(portions)?;
    let mut lines = Vec::with_capacity(dish.lines.len());
    let mut warnings = Vec::new();
    let mut totals = WeightTriple::zero();
    let mut yield_sum = 0.0;
    let mut nutrition_total = Nutrition::zero();
    let mut cost_total = 0.0;

    for line in &dish.lines {
        let product = catalog.get(&line.product_id)?;
        let calc = calc_line(line, product, scale)?;
        if !line.exclude_from_yield {
            totals = totals.add(calc.weights);
            yield_sum += calc.weights.yield_g;
        } else {
            totals.gross_g += calc.weights.gross_g;
            totals.net_g += calc.weights.net_g;
        }
        nutrition_total = nutrition_total.add(calc.nutrition);
        cost_total += calc.cost;
        if line.optional {
            warnings.push(format!(
                "«{}» отмечен как необязательный",
                product.name
            ));
        }
        lines.push(calc);
    }

    let evaporation_g = dish.evaporation_g * scale;
    let after_evap = (yield_sum - evaporation_g).max(0.0);
    let finishing_loss_g = after_evap * (dish.finishing_loss_percent / 100.0);
    let finished_yield_g = (after_evap - finishing_loss_g).max(0.0);
    let portion_yield_g = finished_yield_g / portions;
    let target = dish.target_portion_g;
    let portion_delta_g = if target > 0.0 {
        portion_yield_g - target
    } else {
        0.0
    };

    if target > 0.0 {
        let drift = (portion_delta_g / target).abs();
        if drift > 0.12 {
            warnings.push(format!(
                "выход порции {:.0} г отличается от плана {:.0} г более чем на 12%",
                portion_yield_g, target
            ));
        }
    }

    if finished_yield_g < 1.0 {
        warnings.push("выход блюда почти нулевой — проверьте коэффициенты".into());
    }

    Ok(DishCalc {
        dish_id: dish.id.clone(),
        dish_name: dish.name.clone(),
        portions,
        scale_factor: scale,
        lines,
        totals: WeightTriple {
            gross_g: totals.gross_g,
            net_g: totals.net_g,
            yield_g: yield_sum,
        },
        finished_yield_g,
        portion_yield_g,
        target_portion_g: target,
        portion_delta_g,
        nutrition_total,
        nutrition_per_portion: nutrition_total.scale(1.0 / portions),
        cost_total,
        cost_per_portion: cost_total / portions,
        finishing_loss_g,
        evaporation_g,
        warnings,
    })
}

/// Обратная задача: подогнать закладку так, чтобы выход порции стал целевым.
pub fn fit_to_portion(
    dish: &Dish,
    catalog: &ProductCatalog,
    portions: f64,
    target_portion_g: f64,
) -> Result<DishCalc> {
    if target_portion_g <= 0.0 {
        return Err(Error::InvalidQuantity(format!("{target_portion_g}")));
    }
    let current = calc_dish(dish, catalog, portions)?;
    if current.portion_yield_g <= 0.0 {
        return Err(Error::Validation(
            "нельзя подогнать блюдо с нулевым выходом".into(),
        ));
    }
    let factor = target_portion_g / current.portion_yield_g;
    let mut scaled = dish.clone();
    for line in &mut scaled.lines {
        line.quantity *= factor;
    }
    scaled.target_portion_g = target_portion_g;
    calc_dish(&scaled, catalog, portions)
}

/// Сколько порций получится из ограниченного запаса одного продукта.
pub fn portions_from_stock(
    dish: &Dish,
    catalog: &ProductCatalog,
    product_id: &str,
    stock_g: f64,
) -> Result<f64> {
    if stock_g < 0.0 {
        return Err(Error::InvalidQuantity(format!("{stock_g}")));
    }
    let per_one = calc_dish(dish, catalog, dish.base_portions)?;
    let used: f64 = per_one
        .lines
        .iter()
        .filter(|l| l.product_id == product_id)
        .map(|l| l.weights.gross_g)
        .sum();
    if used <= 0.0 {
        return Err(Error::Validation(format!(
            "продукт {product_id} не входит в блюдо {}",
            dish.name
        )));
    }
    Ok(stock_g / used * dish.base_portions)
}

pub fn line_by_product<'a>(calc: &'a DishCalc, product_id: &str) -> Vec<&'a LineCalc> {
    calc.lines
        .iter()
        .filter(|l| l.product_id == product_id)
        .collect()
}
