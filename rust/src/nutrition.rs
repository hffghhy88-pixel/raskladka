use serde::{Deserialize, Serialize};

/// Пищевая ценность на фиксированную базу (обычно 100 г).
#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize, Deserialize)]
pub struct Nutrition {
    pub kcal: f64,
    pub protein_g: f64,
    pub fat_g: f64,
    pub carbs_g: f64,
    #[serde(default)]
    pub fiber_g: f64,
    #[serde(default)]
    pub sugar_g: f64,
    #[serde(default)]
    pub salt_g: f64,
}

impl Nutrition {
    pub fn zero() -> Self {
        Self::default()
    }

    pub fn scale(self, factor: f64) -> Self {
        Self {
            kcal: self.kcal * factor,
            protein_g: self.protein_g * factor,
            fat_g: self.fat_g * factor,
            carbs_g: self.carbs_g * factor,
            fiber_g: self.fiber_g * factor,
            sugar_g: self.sugar_g * factor,
            salt_g: self.salt_g * factor,
        }
    }

    pub fn add(self, other: Self) -> Self {
        Self {
            kcal: self.kcal + other.kcal,
            protein_g: self.protein_g + other.protein_g,
            fat_g: self.fat_g + other.fat_g,
            carbs_g: self.carbs_g + other.carbs_g,
            fiber_g: self.fiber_g + other.fiber_g,
            sugar_g: self.sugar_g + other.sugar_g,
            salt_g: self.salt_g + other.salt_g,
        }
    }

    /// Пересчёт с 100 г на фактический вес съедобной части.
    pub fn for_grams(self, grams: f64) -> Self {
        self.scale(grams / 100.0)
    }

    pub fn calories_from_macros(self) -> f64 {
        self.protein_g * 4.0 + self.carbs_g * 4.0 + self.fat_g * 9.0
    }

    pub fn rounded(self) -> Self {
        Self {
            kcal: self.kcal.round(),
            protein_g: round1(self.protein_g),
            fat_g: round1(self.fat_g),
            carbs_g: round1(self.carbs_g),
            fiber_g: round1(self.fiber_g),
            sugar_g: round1(self.sugar_g),
            salt_g: round2(self.salt_g),
        }
    }
}

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

fn round2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct DailyNutritionNorm {
    pub kcal: f64,
    pub protein_g: f64,
    pub fat_g: f64,
    pub carbs_g: f64,
}

impl DailyNutritionNorm {
    pub fn adult_mixed() -> Self {
        Self {
            kcal: 2200.0,
            protein_g: 75.0,
            fat_g: 70.0,
            carbs_g: 280.0,
        }
    }

    pub fn school() -> Self {
        Self {
            kcal: 1900.0,
            protein_g: 70.0,
            fat_g: 65.0,
            carbs_g: 260.0,
        }
    }

    pub fn coverage(self, actual: Nutrition) -> NutritionCoverage {
        NutritionCoverage {
            kcal_pct: pct(actual.kcal, self.kcal),
            protein_pct: pct(actual.protein_g, self.protein_g),
            fat_pct: pct(actual.fat_g, self.fat_g),
            carbs_pct: pct(actual.carbs_g, self.carbs_g),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct NutritionCoverage {
    pub kcal_pct: f64,
    pub protein_pct: f64,
    pub fat_pct: f64,
    pub carbs_pct: f64,
}

fn pct(part: f64, norm: f64) -> f64 {
    if norm.abs() < 1e-9 {
        0.0
    } else {
        part / norm * 100.0
    }
}
