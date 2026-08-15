use serde::{Deserialize, Serialize};

use crate::calc::{calc_dish, DishCalc};
use crate::dish::Dish;
use crate::error::{Error, Result};
use crate::product::ProductCatalog;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaleRequest {
    pub portions: f64,
    /// Если задано — дополнительно растягиваем закладку до этого выхода порции.
    #[serde(default)]
    pub target_portion_g: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaledDish {
    pub dish: Dish,
    pub calc: DishCalc,
}

/// Масштабирует количества в карте под новое число порций.
pub fn scale_dish(
    dish: &Dish,
    catalog: &ProductCatalog,
    request: &ScaleRequest,
) -> Result<ScaledDish> {
    if request.portions <= 0.0 {
        return Err(Error::InvalidPortions(request.portions));
    }
    let factor = dish.scale_factor(request.portions)?;
    let mut next = dish.clone();
    for line in &mut next.lines {
        line.quantity *= factor;
    }
    next.evaporation_g *= factor;
    next.base_portions = request.portions;
    if let Some(target) = request.target_portion_g {
        let preview = calc_dish(&next, catalog, request.portions)?;
        if preview.portion_yield_g > 0.0 && (preview.portion_yield_g - target).abs() > 0.5 {
            let fit = target / preview.portion_yield_g;
            for line in &mut next.lines {
                line.quantity *= fit;
            }
            next.evaporation_g *= fit;
        }
        next.target_portion_g = target;
    }
    let calc = calc_dish(&next, catalog, request.portions)?;
    Ok(ScaledDish { dish: next, calc })
}

/// Пересчёт «на глаз»: повар меняет один ингредиент, остальное едет пропорционально.
pub fn scale_from_anchor(
    dish: &Dish,
    catalog: &ProductCatalog,
    line_id: &str,
    new_quantity: f64,
    portions: f64,
) -> Result<ScaledDish> {
    if new_quantity < 0.0 {
        return Err(Error::InvalidQuantity(format!("{new_quantity}")));
    }
    let line = dish
        .lines
        .iter()
        .find(|l| l.id == line_id)
        .ok_or_else(|| Error::Validation(format!("строка {line_id} не найдена")))?;
    if line.quantity <= 0.0 {
        return Err(Error::InvalidQuantity("якорь равен нулю".into()));
    }
    let factor = new_quantity / line.quantity;
    let mut next = dish.clone();
    for item in &mut next.lines {
        item.quantity *= factor;
    }
    next.evaporation_g *= factor;
    let calc = calc_dish(&next, catalog, portions)?;
    Ok(ScaledDish { dish: next, calc })
}

pub fn scale_to_available_product(
    dish: &Dish,
    catalog: &ProductCatalog,
    product_id: &str,
    available_g: f64,
) -> Result<ScaledDish> {
    let portions = crate::calc::portions_from_stock(dish, catalog, product_id, available_g)?;
    scale_dish(
        dish,
        catalog,
        &ScaleRequest {
            portions,
            target_portion_g: None,
        },
    )
}
