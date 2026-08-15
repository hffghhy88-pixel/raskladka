use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::calc::{calc_dish, fit_to_portion, portions_from_stock, DishCalc};
use crate::cost::{cost_card, CostCard, CostSettings};
use crate::dish::Dish;
use crate::error::{Error, Result};
use crate::menu::{calc_menu, MenuCalc};
use crate::nutrition::DailyNutritionNorm;
use crate::production::{plan_day, ProductionPlan};
use crate::report::{dish_compare, menu_summary, DishCompareReport, MenuSummaryReport};
use crate::scale::{scale_dish, scale_from_anchor, ScaleRequest, ScaledDish};
use crate::search::{search, SearchHit};
use crate::shopping::{shopping_from_menu, ShoppingList};
use crate::tech_card::{tech_card, tech_card_markdown, TechCard};
use crate::units::{self, ConversionContext, Unit};
use crate::validate::{validate_workspace, ValidationReport};
use crate::workspace::Workspace;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "cmd", rename_all = "snake_case")]
pub enum Command {
    Ping,
    Convert {
        value: f64,
        from: Unit,
        to: Unit,
        #[serde(default)]
        density_g_per_ml: Option<f64>,
        #[serde(default)]
        piece_weight_g: Option<f64>,
    },
    CalcDish {
        dish_id: String,
        portions: f64,
    },
    CalcDishInline {
        dish: Dish,
        portions: f64,
    },
    ScaleDish {
        dish_id: String,
        portions: f64,
        #[serde(default)]
        target_portion_g: Option<f64>,
    },
    ScaleFromAnchor {
        dish_id: String,
        line_id: String,
        new_quantity: f64,
        portions: f64,
    },
    PortionsFromStock {
        dish_id: String,
        product_id: String,
        stock_g: f64,
    },
    FitPortion {
        dish_id: String,
        portions: f64,
        target_portion_g: f64,
    },
    CalcMenu {
        menu_id: String,
    },
    Shopping {
        menu_id: String,
    },
    TechCard {
        dish_id: String,
        portions: f64,
        #[serde(default)]
        markdown: bool,
    },
    CostCard {
        dish_id: String,
        portions: f64,
        #[serde(default)]
        settings: Option<CostSettings>,
    },
    MenuReport {
        menu_id: String,
        #[serde(default)]
        school_norm: bool,
    },
    CompareDishes {
        left_id: String,
        right_id: String,
        portions: f64,
    },
    Production {
        menu_id: String,
        day_id: String,
    },
    Search {
        query: String,
        #[serde(default = "default_limit")]
        limit: usize,
    },
    Validate,
}

fn default_limit() -> usize {
    20
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EngineResponse {
    Pong {
        version: String,
    },
    Converted {
        value: f64,
        grams: f64,
        label: String,
    },
    Dish {
        calc: DishCalc,
    },
    Scaled {
        scaled: ScaledDish,
    },
    Portions {
        portions: f64,
    },
    Menu {
        calc: MenuCalc,
    },
    Shopping {
        list: ShoppingList,
    },
    Tech {
        card: TechCard,
        #[serde(default)]
        markdown: Option<String>,
    },
    Cost {
        card: CostCard,
    },
    Report {
        report: MenuSummaryReport,
    },
    Compare {
        report: DishCompareReport,
    },
    Production {
        plan: ProductionPlan,
    },
    Search {
        hits: Vec<SearchHit>,
    },
    Validation {
        report: ValidationReport,
    },
    Error {
        message: String,
        #[serde(default)]
        kind: String,
    },
}

pub fn execute(workspace: &Workspace, command: Command) -> Result<EngineResponse> {
    match command {
        Command::Ping => Ok(EngineResponse::Pong {
            version: env!("CARGO_PKG_VERSION").to_string(),
        }),
        Command::Convert {
            value,
            from,
            to,
            density_g_per_ml,
            piece_weight_g,
        } => {
            let ctx = ConversionContext {
                density_g_per_ml,
                piece_weight_g,
                portion_weight_g: None,
            };
            let converted = units::convert(value, from, to, ctx)?;
            let grams = units::to_grams(value, from, ctx)?;
            Ok(EngineResponse::Converted {
                value: converted,
                grams,
                label: units::format_ru(converted, 3, to.code()),
            })
        }
        Command::CalcDish { dish_id, portions } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let calc = calc_dish(dish, &workspace.catalog, portions)?;
            Ok(EngineResponse::Dish { calc })
        }
        Command::CalcDishInline { dish, portions } => {
            let calc = calc_dish(&dish, &workspace.catalog, portions)?;
            Ok(EngineResponse::Dish { calc })
        }
        Command::ScaleDish {
            dish_id,
            portions,
            target_portion_g,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let scaled = scale_dish(
                dish,
                &workspace.catalog,
                &ScaleRequest {
                    portions,
                    target_portion_g,
                },
            )?;
            Ok(EngineResponse::Scaled { scaled })
        }
        Command::ScaleFromAnchor {
            dish_id,
            line_id,
            new_quantity,
            portions,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let scaled = scale_from_anchor(dish, &workspace.catalog, &line_id, new_quantity, portions)?;
            Ok(EngineResponse::Scaled { scaled })
        }
        Command::PortionsFromStock {
            dish_id,
            product_id,
            stock_g,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let portions = portions_from_stock(dish, &workspace.catalog, &product_id, stock_g)?;
            Ok(EngineResponse::Portions { portions })
        }
        Command::FitPortion {
            dish_id,
            portions,
            target_portion_g,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let calc = fit_to_portion(dish, &workspace.catalog, portions, target_portion_g)?;
            Ok(EngineResponse::Dish { calc })
        }
        Command::CalcMenu { menu_id } => {
            let menu = workspace.menus.get(&menu_id)?;
            let calc = calc_menu(menu, &workspace.dishes, &workspace.catalog)?;
            Ok(EngineResponse::Menu { calc })
        }
        Command::Shopping { menu_id } => {
            let menu = workspace.menus.get(&menu_id)?;
            let stock: BTreeMap<String, f64> = workspace.inventory.map();
            let list = shopping_from_menu(menu, &workspace.dishes, &workspace.catalog, &stock)?;
            Ok(EngineResponse::Shopping { list })
        }
        Command::TechCard {
            dish_id,
            portions,
            markdown,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let card = tech_card(dish, &workspace.catalog, portions)?;
            let md = if markdown {
                Some(tech_card_markdown(&card))
            } else {
                None
            };
            Ok(EngineResponse::Tech {
                card,
                markdown: md,
            })
        }
        Command::CostCard {
            dish_id,
            portions,
            settings,
        } => {
            let dish = workspace.dishes.get(&dish_id)?;
            let settings = settings.unwrap_or_else(|| workspace.cost.clone());
            let card = cost_card(dish, &workspace.catalog, portions, &settings)?;
            Ok(EngineResponse::Cost { card })
        }
        Command::MenuReport {
            menu_id,
            school_norm,
        } => {
            let menu = workspace.menus.get(&menu_id)?;
            let norm = if school_norm {
                DailyNutritionNorm::school()
            } else {
                DailyNutritionNorm::adult_mixed()
            };
            let report = menu_summary(menu, &workspace.dishes, &workspace.catalog, norm)?;
            Ok(EngineResponse::Report { report })
        }
        Command::CompareDishes {
            left_id,
            right_id,
            portions,
        } => {
            let report = dish_compare(&left_id, &right_id, portions, &workspace.dishes, &workspace.catalog)?;
            Ok(EngineResponse::Compare { report })
        }
        Command::Production { menu_id, day_id } => {
            let menu = workspace.menus.get(&menu_id)?;
            let day = menu
                .days
                .iter()
                .find(|d| d.id == day_id)
                .ok_or_else(|| Error::Validation(format!("день {day_id} не найден")))?;
            let plan = plan_day(menu, day, &workspace.dishes, &workspace.catalog)?;
            Ok(EngineResponse::Production { plan })
        }
        Command::Search { query, limit } => {
            let hits = search(
                &query,
                &workspace.catalog,
                &workspace.dishes,
                &workspace.menus,
                limit,
            );
            Ok(EngineResponse::Search { hits })
        }
        Command::Validate => {
            let report = validate_workspace(&workspace.catalog, &workspace.dishes, &workspace.menus);
            Ok(EngineResponse::Validation { report })
        }
    }
}

pub fn execute_json(workspace_json: &str, command_json: &str) -> String {
    let result = (|| -> Result<EngineResponse> {
        let workspace: Workspace = serde_json::from_str(workspace_json)?;
        let command: Command = serde_json::from_str(command_json)?;
        execute(&workspace, command)
    })();
    match result {
        Ok(response) => serde_json::to_string(&response).unwrap_or_else(|e| {
            serde_json::to_string(&EngineResponse::Error {
                message: e.to_string(),
                kind: "json".into(),
            })
            .unwrap_or_else(|_| r#"{"type":"error","message":"fatal"}"#.into())
        }),
        Err(err) => serde_json::to_string(&EngineResponse::Error {
            message: err.to_string(),
            kind: format!("{err:?}").split('(').next().unwrap_or("error").into(),
        })
        .unwrap_or_else(|_| r#"{"type":"error","message":"fatal"}"#.into()),
    }
}

/// Один JSON: `{ "workspace": ..., "command": ... }`.
pub fn execute_bundle(bundle_json: &str) -> String {
    #[derive(Deserialize)]
    struct Bundle {
        workspace: Workspace,
        command: Command,
    }
    match serde_json::from_str::<Bundle>(bundle_json) {
        Ok(bundle) => match execute(&bundle.workspace, bundle.command) {
            Ok(response) => serde_json::to_string(&response).unwrap_or_else(|e| wrap_err(&e.to_string())),
            Err(err) => wrap_err(&err.to_string()),
        },
        Err(err) => wrap_err(&err.to_string()),
    }
}

fn wrap_err(message: &str) -> String {
    serde_json::to_string(&EngineResponse::Error {
        message: message.to_string(),
        kind: "error".into(),
    })
    .unwrap_or_else(|_| r#"{"type":"error","message":"fatal"}"#.into())
}
