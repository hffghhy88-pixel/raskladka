use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::nutrition::Nutrition;
use crate::units::{ConversionContext, Unit};
use crate::yield_table::{ColdProcess, HotProcess, YieldProfile};

#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProductCategory {
    #[default]
    Vegetables,
    Fruits,
    Berries,
    Greens,
    Mushrooms,
    Meat,
    Poultry,
    Fish,
    Seafood,
    Dairy,
    Eggs,
    Groats,
    Flour,
    Pasta,
    Bakery,
    Legumes,
    Nuts,
    Oils,
    Spices,
    Sweets,
    Drinks,
    Canned,
    SemiFinished,
    Other,
}

impl ProductCategory {
    pub fn label(self) -> &'static str {
        match self {
            ProductCategory::Vegetables => "Овощи",
            ProductCategory::Fruits => "Фрукты",
            ProductCategory::Berries => "Ягоды",
            ProductCategory::Greens => "Зелень",
            ProductCategory::Mushrooms => "Грибы",
            ProductCategory::Meat => "Мясо",
            ProductCategory::Poultry => "Птица",
            ProductCategory::Fish => "Рыба",
            ProductCategory::Seafood => "Морепродукты",
            ProductCategory::Dairy => "Молочка",
            ProductCategory::Eggs => "Яйца",
            ProductCategory::Groats => "Крупы",
            ProductCategory::Flour => "Мука",
            ProductCategory::Pasta => "Макароны",
            ProductCategory::Bakery => "Выпечка",
            ProductCategory::Legumes => "Бобовые",
            ProductCategory::Nuts => "Орехи",
            ProductCategory::Oils => "Масла",
            ProductCategory::Spices => "Специи",
            ProductCategory::Sweets => "Сладости",
            ProductCategory::Drinks => "Напитки",
            ProductCategory::Canned => "Консервы",
            ProductCategory::SemiFinished => "Полуфабрикаты",
            ProductCategory::Other => "Прочее",
        }
    }

    pub fn all() -> &'static [ProductCategory] {
        &ALL_CATEGORIES
    }
}

const ALL_CATEGORIES: [ProductCategory; 24] = [
    ProductCategory::Vegetables,
    ProductCategory::Fruits,
    ProductCategory::Berries,
    ProductCategory::Greens,
    ProductCategory::Mushrooms,
    ProductCategory::Meat,
    ProductCategory::Poultry,
    ProductCategory::Fish,
    ProductCategory::Seafood,
    ProductCategory::Dairy,
    ProductCategory::Eggs,
    ProductCategory::Groats,
    ProductCategory::Flour,
    ProductCategory::Pasta,
    ProductCategory::Bakery,
    ProductCategory::Legumes,
    ProductCategory::Nuts,
    ProductCategory::Oils,
    ProductCategory::Spices,
    ProductCategory::Sweets,
    ProductCategory::Drinks,
    ProductCategory::Canned,
    ProductCategory::SemiFinished,
    ProductCategory::Other,
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub name_genitive: Option<String>,
    #[serde(default)]
    pub category: ProductCategory,
    #[serde(default)]
    pub subcategory: Option<String>,
    #[serde(default = "default_unit_gram")]
    pub default_unit: Unit,
    /// Плотность, г/мл. Нужна, чтобы перевести мл/ложки в граммы.
    #[serde(default)]
    pub density_g_per_ml: Option<f64>,
    /// Средний вес одной штуки / пучка / головки, г.
    #[serde(default)]
    pub piece_weight_g: Option<f64>,
    #[serde(default)]
    pub yield_profile: YieldProfile,
    /// Пищевая ценность на 100 г съедобной части (нетто).
    #[serde(default)]
    pub nutrition_per_100g: Nutrition,
    #[serde(default)]
    pub allergens: Vec<String>,
    /// Закупочная цена за 1 кг брутто.
    #[serde(default)]
    pub price_per_kg: f64,
    #[serde(default)]
    pub supplier: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub is_semi_finished: bool,
    /// Если продукт — полуфабрикат из другого блюда.
    #[serde(default)]
    pub source_dish_id: Option<String>,
    #[serde(default)]
    pub storage_days: Option<u32>,
    #[serde(default)]
    pub season_months: Vec<u8>,
    #[serde(default)]
    pub archived: bool,
}

fn default_unit_gram() -> Unit {
    Unit::Gram
}

impl Product {
    pub fn conversion_context(&self) -> ConversionContext {
        ConversionContext {
            density_g_per_ml: self.density_g_per_ml,
            piece_weight_g: self.piece_weight_g,
            portion_weight_g: None,
        }
    }

    pub fn conversion_context_with_portion(&self, portion_g: f64) -> ConversionContext {
        ConversionContext {
            density_g_per_ml: self.density_g_per_ml,
            piece_weight_g: self.piece_weight_g,
            portion_weight_g: Some(portion_g),
        }
    }

    pub fn cold_loss_percent(&self, process: ColdProcess) -> f64 {
        self.yield_profile.cold_loss_percent(process)
    }

    pub fn hot_yield_percent(&self, process: HotProcess) -> f64 {
        self.yield_profile.hot_yield_percent(process)
    }

    pub fn validate(&self) -> Result<()> {
        if self.id.trim().is_empty() {
            return Err(Error::Validation("у продукта пустой id".into()));
        }
        if self.name.trim().is_empty() {
            return Err(Error::Validation(format!("у продукта {} пустое имя", self.id)));
        }
        if let Some(d) = self.density_g_per_ml {
            if d <= 0.0 {
                return Err(Error::Validation(format!(
                    "{}: плотность должна быть > 0",
                    self.name
                )));
            }
        }
        if let Some(p) = self.piece_weight_g {
            if p <= 0.0 {
                return Err(Error::Validation(format!(
                    "{}: вес штуки должен быть > 0",
                    self.name
                )));
            }
        }
        if self.price_per_kg < 0.0 {
            return Err(Error::Validation(format!(
                "{}: цена не может быть отрицательной",
                self.name
            )));
        }
        self.yield_profile.validate(&self.name)?;
        Ok(())
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProductCatalog {
    pub products: Vec<Product>,
}

impl ProductCatalog {
    pub fn new(products: Vec<Product>) -> Self {
        Self { products }
    }

    pub fn get(&self, id: &str) -> Result<&Product> {
        self.products
            .iter()
            .find(|p| p.id == id)
            .ok_or_else(|| Error::ProductNotFound(id.to_string()))
    }

    pub fn get_mut(&mut self, id: &str) -> Result<&mut Product> {
        self.products
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or_else(|| Error::ProductNotFound(id.to_string()))
    }

    pub fn upsert(&mut self, product: Product) {
        if let Some(existing) = self.products.iter_mut().find(|p| p.id == product.id) {
            *existing = product;
        } else {
            self.products.push(product);
        }
    }

    pub fn remove(&mut self, id: &str) -> Result<Product> {
        let idx = self
            .products
            .iter()
            .position(|p| p.id == id)
            .ok_or_else(|| Error::ProductNotFound(id.to_string()))?;
        Ok(self.products.remove(idx))
    }

    pub fn by_category(&self, category: ProductCategory) -> Vec<&Product> {
        self.products
            .iter()
            .filter(|p| p.category == category && !p.archived)
            .collect()
    }

    pub fn validate_all(&self) -> Result<()> {
        for product in &self.products {
            product.validate()?;
        }
        Ok(())
    }
}
