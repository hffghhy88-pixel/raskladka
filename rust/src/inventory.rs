use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::error::{Error, Result};
use crate::product::ProductCatalog;
use crate::shopping::ShoppingList;
use crate::units;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockItem {
    pub product_id: String,
    pub quantity_g: f64,
    #[serde(default)]
    pub reserved_g: f64,
    #[serde(default)]
    pub min_g: f64,
    #[serde(default)]
    pub location: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Inventory {
    pub items: Vec<StockItem>,
}

impl Inventory {
    pub fn map(&self) -> BTreeMap<String, f64> {
        self.items
            .iter()
            .map(|i| (i.product_id.clone(), (i.quantity_g - i.reserved_g).max(0.0)))
            .collect()
    }

    pub fn get(&self, product_id: &str) -> f64 {
        self.items
            .iter()
            .find(|i| i.product_id == product_id)
            .map(|i| i.quantity_g)
            .unwrap_or(0.0)
    }

    pub fn set(&mut self, product_id: &str, quantity_g: f64) -> Result<()> {
        if quantity_g < 0.0 {
            return Err(Error::InvalidQuantity(format!("{quantity_g}")));
        }
        if let Some(item) = self.items.iter_mut().find(|i| i.product_id == product_id) {
            item.quantity_g = quantity_g;
        } else {
            self.items.push(StockItem {
                product_id: product_id.to_string(),
                quantity_g,
                reserved_g: 0.0,
                min_g: 0.0,
                location: None,
            });
        }
        Ok(())
    }

    pub fn consume(&mut self, product_id: &str, grams: f64) -> Result<f64> {
        if grams < 0.0 {
            return Err(Error::InvalidQuantity(format!("{grams}")));
        }
        let item = self
            .items
            .iter_mut()
            .find(|i| i.product_id == product_id)
            .ok_or_else(|| Error::ProductNotFound(product_id.to_string()))?;
        let take = grams.min(item.quantity_g);
        item.quantity_g -= take;
        Ok(take)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockAlert {
    pub product_id: String,
    pub product_name: String,
    pub on_hand: String,
    pub minimum: String,
    pub kind: AlertKind,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertKind {
    Empty,
    BelowMin,
    ReservedExceeds,
}

pub fn alerts(inventory: &Inventory, catalog: &ProductCatalog) -> Vec<StockAlert> {
    let mut out = Vec::new();
    for item in &inventory.items {
        let name = catalog
            .get(&item.product_id)
            .map(|p| p.name.clone())
            .unwrap_or_else(|_| item.product_id.clone());
        if item.quantity_g <= 0.0 {
            out.push(StockAlert {
                product_id: item.product_id.clone(),
                product_name: name,
                on_hand: units::format_mass_grams(item.quantity_g),
                minimum: units::format_mass_grams(item.min_g),
                kind: AlertKind::Empty,
            });
            continue;
        }
        if item.min_g > 0.0 && item.quantity_g < item.min_g {
            out.push(StockAlert {
                product_id: item.product_id.clone(),
                product_name: name,
                on_hand: units::format_mass_grams(item.quantity_g),
                minimum: units::format_mass_grams(item.min_g),
                kind: AlertKind::BelowMin,
            });
            continue;
        }
        if item.reserved_g > item.quantity_g {
            out.push(StockAlert {
                product_id: item.product_id.clone(),
                product_name: name,
                on_hand: units::format_mass_grams(item.quantity_g),
                minimum: units::format_mass_grams(item.reserved_g),
                kind: AlertKind::ReservedExceeds,
            });
        }
    }
    out
}

pub fn apply_purchase(inventory: &mut Inventory, list: &ShoppingList) -> Result<()> {
    for item in &list.items {
        let current = inventory.get(&item.product_id);
        inventory.set(&item.product_id, current + item.to_buy_g)?;
    }
    Ok(())
}
