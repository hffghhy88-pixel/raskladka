use crate::dish::{Dish, DishBook};
use crate::menu::{Menu, MenuBook};
use crate::product::{Product, ProductCatalog};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHit {
    pub kind: SearchKind,
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub score: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SearchKind {
    Product,
    Dish,
    Menu,
}

pub fn search(
    query: &str,
    catalog: &ProductCatalog,
    dishes: &DishBook,
    menus: &MenuBook,
    limit: usize,
) -> Vec<SearchHit> {
    let q = normalize(query);
    if q.is_empty() {
        return Vec::new();
    }
    let mut hits = Vec::new();
    for product in &catalog.products {
        if product.archived {
            continue;
        }
        if let Some(score) = score_product(&q, product) {
            hits.push(SearchHit {
                kind: SearchKind::Product,
                id: product.id.clone(),
                title: product.name.clone(),
                subtitle: product.category.label().to_string(),
                score,
            });
        }
    }
    for dish in &dishes.dishes {
        if dish.archived {
            continue;
        }
        if let Some(score) = score_dish(&q, dish) {
            hits.push(SearchHit {
                kind: SearchKind::Dish,
                id: dish.id.clone(),
                title: dish.name.clone(),
                subtitle: dish.category.label().to_string(),
                score,
            });
        }
    }
    for menu in &menus.menus {
        if menu.archived {
            continue;
        }
        if let Some(score) = score_menu(&q, menu) {
            hits.push(SearchHit {
                kind: SearchKind::Menu,
                id: menu.id.clone(),
                title: menu.name.clone(),
                subtitle: format!("{} дн.", menu.days.len()),
                score,
            });
        }
    }
    hits.sort_by(|a, b| b.score.cmp(&a.score).then(a.title.cmp(&b.title)));
    hits.truncate(limit.max(1));
    hits
}

fn normalize(raw: &str) -> String {
    raw.trim()
        .to_lowercase()
        .replace('ё', "е")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn score_text(query: &str, text: &str) -> i32 {
    let hay = normalize(text);
    if hay == query {
        return 100;
    }
    if hay.starts_with(query) {
        return 80;
    }
    if hay.contains(query) {
        return 50;
    }
    let tokens: Vec<&str> = query.split_whitespace().collect();
    if tokens.is_empty() {
        return 0;
    }
    let matched = tokens.iter().filter(|t| hay.contains(*t)).count();
    if matched == tokens.len() {
        return 35;
    }
    if matched > 0 {
        return 15;
    }
    0
}

fn score_product(query: &str, product: &Product) -> Option<i32> {
    let mut score = score_text(query, &product.name);
    if let Some(sub) = &product.subcategory {
        score = score.max(score_text(query, sub) / 2);
    }
    if let Some(notes) = &product.notes {
        score = score.max(score_text(query, notes) / 3);
    }
    if score > 0 {
        Some(score)
    } else {
        None
    }
}

fn score_dish(query: &str, dish: &Dish) -> Option<i32> {
    let mut score = score_text(query, &dish.name);
    for tag in &dish.tags {
        score = score.max(score_text(query, tag) / 2);
    }
    if score > 0 {
        Some(score)
    } else {
        None
    }
}

fn score_menu(query: &str, menu: &Menu) -> Option<i32> {
    let mut score = score_text(query, &menu.name);
    if let Some(venue) = &menu.venue {
        score = score.max(score_text(query, venue) / 2);
    }
    if score > 0 {
        Some(score)
    } else {
        None
    }
}
