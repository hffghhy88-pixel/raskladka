use raskladka_engine::calc::calc_dish;
use raskladka_engine::dish::{Dish, DishBook, DishCategory, DishLine, LineGroup};
use raskladka_engine::engine::{execute, Command};
use raskladka_engine::menu::{MealKind, Menu, MenuBook, MenuDay, MenuSlot};
use raskladka_engine::nutrition::Nutrition;
use raskladka_engine::product::{Product, ProductCatalog, ProductCategory};
use raskladka_engine::units::Unit;
use raskladka_engine::yield_table::{typical_vegetable_root, ColdProcess, HotProcess};
use raskladka_engine::Workspace;

fn potato() -> Product {
    Product {
        id: "potato".into(),
        name: "Картофель".into(),
        name_genitive: Some("картофеля".into()),
        category: ProductCategory::Vegetables,
        subcategory: Some("корнеплоды".into()),
        default_unit: Unit::Kilogram,
        density_g_per_ml: None,
        piece_weight_g: Some(120.0),
        yield_profile: typical_vegetable_root(),
        nutrition_per_100g: Nutrition {
            kcal: 77.0,
            protein_g: 2.0,
            fat_g: 0.1,
            carbs_g: 16.3,
            fiber_g: 1.4,
            sugar_g: 0.8,
            salt_g: 0.01,
        },
        allergens: vec![],
        price_per_kg: 45.0,
        supplier: None,
        notes: None,
        is_semi_finished: false,
        source_dish_id: None,
        storage_days: Some(30),
        season_months: vec![],
        archived: false,
    }
}

fn puree() -> Dish {
    Dish {
        id: "puree".into(),
        name: "Пюре".into(),
        category: DishCategory::Side,
        base_portions: 10.0,
        target_portion_g: 180.0,
        lines: vec![DishLine {
            id: "l1".into(),
            product_id: "potato".into(),
            quantity: 2.4,
            unit: Unit::Kilogram,
            cold: ColdProcess::Peel,
            hot: HotProcess::Boil,
            cold_loss_override: None,
            hot_yield_override: None,
            group: LineGroup::Main,
            note: None,
            optional: false,
            exclude_from_yield: false,
            exclude_from_shopping: false,
        }],
        steps: vec!["Очистить".into(), "Сварить".into(), "Протереть".into()],
        description: Some("Картофельное пюре".into()),
        cook_time_min: 30,
        prep_time_min: 15,
        difficulty: 1,
        tags: vec!["гарнир".into()],
        cuisine: Some("русская".into()),
        finishing_loss_percent: 2.0,
        evaporation_g: 0.0,
        archived: false,
    }
}

fn workspace() -> Workspace {
    Workspace {
        title: "тест".into(),
        catalog: ProductCatalog::new(vec![potato()]),
        dishes: DishBook {
            dishes: vec![puree()],
        },
        menus: MenuBook {
            menus: vec![Menu {
                id: "week".into(),
                name: "Неделя".into(),
                period_from: None,
                period_to: None,
                guests: 10.0,
                days: vec![MenuDay {
                    id: "d1".into(),
                    date_label: "Пн".into(),
                    slots: vec![MenuSlot {
                        id: "s1".into(),
                        dish_id: "puree".into(),
                        portions: 10.0,
                        meal: MealKind::Lunch,
                        note: None,
                    }],
                    guests_override: None,
                }],
                venue: None,
                notes: None,
                archived: false,
            }],
        },
        ..Workspace::empty()
    }
}

#[test]
fn potato_peel_and_boil() {
    let ws = workspace();
    let calc = calc_dish(ws.dishes.get("puree").unwrap(), &ws.catalog, 10.0).unwrap();
    assert!((calc.totals.gross_g - 2400.0).abs() < 0.1);
    assert!((calc.totals.net_g - 1800.0).abs() < 0.1);
    assert!(calc.finished_yield_g > 1600.0);
    assert!(calc.cost_total > 0.0);
}

#[test]
fn scale_doubles_gross() {
    let ws = workspace();
    let a = calc_dish(ws.dishes.get("puree").unwrap(), &ws.catalog, 10.0).unwrap();
    let b = calc_dish(ws.dishes.get("puree").unwrap(), &ws.catalog, 20.0).unwrap();
    assert!((b.totals.gross_g - a.totals.gross_g * 2.0).abs() < 0.2);
}

#[test]
fn engine_shopping() {
    let ws = workspace();
    let response = execute(&ws, Command::Shopping { menu_id: "week".into() }).unwrap();
    match response {
        raskladka_engine::EngineResponse::Shopping { list } => {
            assert_eq!(list.items.len(), 1);
            assert!((list.items[0].gross_g - 2400.0).abs() < 0.1);
        }
        other => panic!("unexpected {other:?}"),
    }
}

#[test]
fn engine_ping() {
    let ws = Workspace::empty();
    let response = execute(&ws, Command::Ping).unwrap();
    match response {
        raskladka_engine::EngineResponse::Pong { version } => {
            assert!(!version.is_empty());
        }
        other => panic!("unexpected {other:?}"),
    }
}
