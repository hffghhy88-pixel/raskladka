use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::units::Unit;
use crate::yield_table::{ColdProcess, HotProcess};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DishCategory {
    Soup,
    Salad,
    Appetizer,
    Main,
    Side,
    Sauce,
    Drink,
    Bakery,
    Dessert,
    Breakfast,
    SemiFinished,
    Other,
}

impl DishCategory {
    pub fn label(self) -> &'static str {
        match self {
            DishCategory::Soup => "Супы",
            DishCategory::Salad => "Салаты",
            DishCategory::Appetizer => "Закуски",
            DishCategory::Main => "Горячее",
            DishCategory::Side => "Гарниры",
            DishCategory::Sauce => "Соусы",
            DishCategory::Drink => "Напитки",
            DishCategory::Bakery => "Выпечка",
            DishCategory::Dessert => "Десерты",
            DishCategory::Breakfast => "Завтраки",
            DishCategory::SemiFinished => "Полуфабрикаты",
            DishCategory::Other => "Прочее",
        }
    }

    pub fn all() -> &'static [DishCategory] {
        &[
            DishCategory::Soup,
            DishCategory::Salad,
            DishCategory::Appetizer,
            DishCategory::Main,
            DishCategory::Side,
            DishCategory::Sauce,
            DishCategory::Drink,
            DishCategory::Bakery,
            DishCategory::Dessert,
            DishCategory::Breakfast,
            DishCategory::SemiFinished,
            DishCategory::Other,
        ]
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LineGroup {
    Main,
    Garnish,
    Sauce,
    Dressing,
    Broth,
    GarnishExtra,
    Decor,
}

impl LineGroup {
    pub fn label(self) -> &'static str {
        match self {
            LineGroup::Main => "Основа",
            LineGroup::Garnish => "Гарнир",
            LineGroup::Sauce => "Соус",
            LineGroup::Dressing => "Заправка",
            LineGroup::Broth => "Бульон / жидкость",
            LineGroup::GarnishExtra => "Дополнение",
            LineGroup::Decor => "Подача",
        }
    }
}

/// Строка технологической карты: продукт + сколько кладём + как обрабатываем.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DishLine {
    pub id: String,
    pub product_id: String,
    pub quantity: f64,
    pub unit: Unit,
    #[serde(default)]
    pub cold: ColdProcess,
    #[serde(default)]
    pub hot: HotProcess,
    /// Если задано — подменяет таблицу продукта для холодной потери, %.
    #[serde(default)]
    pub cold_loss_override: Option<f64>,
    /// Если задано — подменяет выход после тепловой обработки, % от нетто.
    #[serde(default)]
    pub hot_yield_override: Option<f64>,
    #[serde(default)]
    pub group: LineGroup,
    #[serde(default)]
    pub note: Option<String>,
    #[serde(default)]
    pub optional: bool,
    /// Не учитывать в выходе блюда (например, вода для варки макарон).
    #[serde(default)]
    pub exclude_from_yield: bool,
    /// Не закупать отдельно (уже есть в полуфабрикате).
    #[serde(default)]
    pub exclude_from_shopping: bool,
}

impl Default for ColdProcess {
    fn default() -> Self {
        ColdProcess::None
    }
}

impl Default for HotProcess {
    fn default() -> Self {
        HotProcess::None
    }
}

impl Default for LineGroup {
    fn default() -> Self {
        LineGroup::Main
    }
}

impl Default for DishCategory {
    fn default() -> Self {
        DishCategory::Other
    }
}

impl DishLine {
    pub fn validate(&self) -> Result<()> {
        if self.product_id.trim().is_empty() {
            return Err(Error::EmptyDishLine);
        }
        if !self.quantity.is_finite() || self.quantity < 0.0 {
            return Err(Error::InvalidQuantity(format!("{}", self.quantity)));
        }
        if let Some(v) = self.cold_loss_override {
            if !(0.0..=95.0).contains(&v) {
                return Err(Error::InvalidYield(v));
            }
        }
        if let Some(v) = self.hot_yield_override {
            if !(10.0..=400.0).contains(&v) {
                return Err(Error::InvalidYield(v));
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dish {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub category: DishCategory,
    /// На сколько порций составлена карта.
    #[serde(default = "one")]
    pub base_portions: f64,
    /// Плановый выход одной порции, г. Если 0 — берём сумму выходов строк.
    #[serde(default)]
    pub target_portion_g: f64,
    #[serde(default)]
    pub lines: Vec<DishLine>,
    #[serde(default)]
    pub steps: Vec<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub cook_time_min: u32,
    #[serde(default)]
    pub prep_time_min: u32,
    #[serde(default)]
    pub difficulty: u8,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub cuisine: Option<String>,
    /// Доп. технологические потери на смешивание / формовку / нарезку, % от суммы выходов.
    #[serde(default)]
    pub finishing_loss_percent: f64,
    /// Вода / бульон, который выкипает и не входит в выход, г на базовую закладку.
    #[serde(default)]
    pub evaporation_g: f64,
    #[serde(default)]
    pub archived: bool,
}

fn one() -> f64 {
    1.0
}

impl Dish {
    pub fn validate(&self) -> Result<()> {
        if self.id.trim().is_empty() {
            return Err(Error::Validation("у блюда пустой id".into()));
        }
        if self.name.trim().is_empty() {
            return Err(Error::Validation(format!("у блюда {} пустое имя", self.id)));
        }
        if !self.base_portions.is_finite() || self.base_portions <= 0.0 {
            return Err(Error::InvalidPortions(self.base_portions));
        }
        if self.finishing_loss_percent < 0.0 || self.finishing_loss_percent > 50.0 {
            return Err(Error::InvalidYield(self.finishing_loss_percent));
        }
        if self.lines.is_empty() {
            return Err(Error::Validation(format!(
                "блюдо «{}» без продуктов",
                self.name
            )));
        }
        for line in &self.lines {
            line.validate()?;
        }
        Ok(())
    }

    pub fn scale_factor(&self, portions: f64) -> Result<f64> {
        if !portions.is_finite() || portions <= 0.0 {
            return Err(Error::InvalidPortions(portions));
        }
        Ok(portions / self.base_portions)
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DishBook {
    pub dishes: Vec<Dish>,
}

impl DishBook {
    pub fn get(&self, id: &str) -> Result<&Dish> {
        self.dishes
            .iter()
            .find(|d| d.id == id)
            .ok_or_else(|| Error::DishNotFound(id.to_string()))
    }

    pub fn upsert(&mut self, dish: Dish) {
        if let Some(existing) = self.dishes.iter_mut().find(|d| d.id == dish.id) {
            *existing = dish;
        } else {
            self.dishes.push(dish);
        }
    }

    pub fn remove(&mut self, id: &str) -> Result<Dish> {
        let idx = self
            .dishes
            .iter()
            .position(|d| d.id == id)
            .ok_or_else(|| Error::DishNotFound(id.to_string()))?;
        Ok(self.dishes.remove(idx))
    }
}
