use crate::dish::DishBook;
use crate::error::{Error, Result};
use crate::menu::MenuBook;
use crate::product::ProductCatalog;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ValidationReport {
    pub ok: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

impl ValidationReport {
    pub fn new() -> Self {
        Self {
            ok: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        }
    }

    pub fn error(&mut self, message: impl Into<String>) {
        self.ok = false;
        self.errors.push(message.into());
    }

    pub fn warn(&mut self, message: impl Into<String>) {
        self.warnings.push(message.into());
    }
}

impl Default for ValidationReport {
    fn default() -> Self {
        Self::new()
    }
}

pub fn validate_workspace(
    catalog: &ProductCatalog,
    dishes: &DishBook,
    menus: &MenuBook,
) -> ValidationReport {
    let mut report = ValidationReport::new();

    let mut ids = std::collections::HashSet::new();
    for product in &catalog.products {
        if !ids.insert(product.id.clone()) {
            report.error(format!("дублируется продукт {}", product.id));
        }
        if let Err(err) = product.validate() {
            report.error(err.to_string());
        }
        if product.price_per_kg == 0.0 {
            report.warn(format!("у «{}» нет цены — калькуляция будет нулевой", product.name));
        }
        if product.nutrition_per_100g.kcal == 0.0
            && !matches!(
                product.category,
                crate::product::ProductCategory::Spices | crate::product::ProductCategory::Drinks
            )
        {
            report.warn(format!("у «{}» не заполнена пищевая ценность", product.name));
        }
    }

    let mut dish_ids = std::collections::HashSet::new();
    for dish in &dishes.dishes {
        if !dish_ids.insert(dish.id.clone()) {
            report.error(format!("дублируется блюдо {}", dish.id));
        }
        if let Err(err) = dish.validate() {
            report.error(err.to_string());
        }
        for line in &dish.lines {
            if catalog.get(&line.product_id).is_err() {
                report.error(format!(
                    "блюдо «{}»: продукт {} не найден",
                    dish.name, line.product_id
                ));
            }
        }
        if dish.target_portion_g == 0.0 {
            report.warn(format!(
                "у «{}» нет планового выхода порции",
                dish.name
            ));
        }
    }

    let mut menu_ids = std::collections::HashSet::new();
    for menu in &menus.menus {
        if !menu_ids.insert(menu.id.clone()) {
            report.error(format!("дублируется меню {}", menu.id));
        }
        if let Err(err) = menu.validate() {
            report.error(err.to_string());
        }
        for day in &menu.days {
            for slot in &day.slots {
                if dishes.get(&slot.dish_id).is_err() {
                    report.error(format!(
                        "меню «{}», день {}: блюдо {} не найдено",
                        menu.name, day.date_label, slot.dish_id
                    ));
                }
            }
        }
    }

    report
}

pub fn require_ok(report: &ValidationReport) -> Result<()> {
    if report.ok {
        Ok(())
    } else {
        Err(Error::Validation(report.errors.join("; ")))
    }
}
