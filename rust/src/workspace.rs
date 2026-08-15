use serde::{Deserialize, Serialize};

use crate::cost::CostSettings;
use crate::dish::DishBook;
use crate::inventory::Inventory;
use crate::menu::MenuBook;
use crate::product::ProductCatalog;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Workspace {
    #[serde(default)]
    pub catalog: ProductCatalog,
    #[serde(default)]
    pub dishes: DishBook,
    #[serde(default)]
    pub menus: MenuBook,
    #[serde(default)]
    pub inventory: Inventory,
    #[serde(default)]
    pub cost: CostSettings,
    #[serde(default)]
    pub title: String,
}

impl Workspace {
    pub fn empty() -> Self {
        Self {
            title: "Новая кухня".into(),
            ..Self::default()
        }
    }
}
