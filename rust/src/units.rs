use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

use crate::error::{Error, Result};

/// Кухонная единица измерения. Масса — канон (граммы).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Unit {
    Milligram,
    #[default]
    Gram,
    Kilogram,
    Milliliter,
    Liter,
    Teaspoon,
    Tablespoon,
    Cup,
    Glass,
    Piece,
    Bunch,
    Clove,
    Pinch,
    Head,
    Slice,
    Packet,
    Can,
    Portion,
}

impl Unit {
    pub fn code(self) -> &'static str {
        match self {
            Unit::Milligram => "мг",
            Unit::Gram => "г",
            Unit::Kilogram => "кг",
            Unit::Milliliter => "мл",
            Unit::Liter => "л",
            Unit::Teaspoon => "ч.л.",
            Unit::Tablespoon => "ст.л.",
            Unit::Cup => "чашка",
            Unit::Glass => "стакан",
            Unit::Piece => "шт",
            Unit::Bunch => "пучок",
            Unit::Clove => "зубчик",
            Unit::Pinch => "щепотка",
            Unit::Head => "головка",
            Unit::Slice => "ломтик",
            Unit::Packet => "пакет",
            Unit::Can => "банка",
            Unit::Portion => "порц.",
        }
    }

    pub fn name_full(self) -> &'static str {
        match self {
            Unit::Milligram => "миллиграмм",
            Unit::Gram => "грамм",
            Unit::Kilogram => "килограмм",
            Unit::Milliliter => "миллилитр",
            Unit::Liter => "литр",
            Unit::Teaspoon => "чайная ложка",
            Unit::Tablespoon => "столовая ложка",
            Unit::Cup => "чашка (240 мл)",
            Unit::Glass => "стакан (200 мл)",
            Unit::Piece => "штука",
            Unit::Bunch => "пучок",
            Unit::Clove => "зубчик",
            Unit::Pinch => "щепотка",
            Unit::Head => "головка",
            Unit::Slice => "ломтик",
            Unit::Packet => "пакет",
            Unit::Can => "банка",
            Unit::Portion => "порция",
        }
    }

    pub fn family(self) -> UnitFamily {
        match self {
            Unit::Milligram | Unit::Gram | Unit::Kilogram => UnitFamily::Mass,
            Unit::Milliliter
            | Unit::Liter
            | Unit::Teaspoon
            | Unit::Tablespoon
            | Unit::Cup
            | Unit::Glass
            | Unit::Pinch => UnitFamily::Volume,
            Unit::Portion => UnitFamily::Portion,
            _ => UnitFamily::Count,
        }
    }

    pub fn is_mass(self) -> bool {
        matches!(self.family(), UnitFamily::Mass)
    }

    pub fn is_volume(self) -> bool {
        matches!(self.family(), UnitFamily::Volume)
    }

    pub fn is_count(self) -> bool {
        matches!(self.family(), UnitFamily::Count)
    }

    /// Сколько миллилитров в одной единице объёма.
    pub fn milliliters(self) -> Option<f64> {
        match self {
            Unit::Milliliter => Some(1.0),
            Unit::Liter => Some(1000.0),
            Unit::Teaspoon => Some(5.0),
            Unit::Tablespoon => Some(15.0),
            Unit::Cup => Some(240.0),
            Unit::Glass => Some(200.0),
            Unit::Pinch => Some(0.3),
            _ => None,
        }
    }

    /// Сколько граммов в одной единице массы.
    pub fn grams(self) -> Option<f64> {
        match self {
            Unit::Milligram => Some(0.001),
            Unit::Gram => Some(1.0),
            Unit::Kilogram => Some(1000.0),
            _ => None,
        }
    }

    pub fn all() -> &'static [Unit] {
        &ALL_UNITS
    }

    pub fn parse_loose(raw: &str) -> Result<Unit> {
        raw.parse()
    }
}

const ALL_UNITS: [Unit; 18] = [
    Unit::Milligram,
    Unit::Gram,
    Unit::Kilogram,
    Unit::Milliliter,
    Unit::Liter,
    Unit::Teaspoon,
    Unit::Tablespoon,
    Unit::Cup,
    Unit::Glass,
    Unit::Piece,
    Unit::Bunch,
    Unit::Clove,
    Unit::Pinch,
    Unit::Head,
    Unit::Slice,
    Unit::Packet,
    Unit::Can,
    Unit::Portion,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnitFamily {
    Mass,
    Volume,
    Count,
    Portion,
}

impl fmt::Display for Unit {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl FromStr for Unit {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        let key = s.trim().to_lowercase().replace('ё', "е");
        let key = key.replace('.', "").replace(' ', "");
        let unit = match key.as_str() {
            "мг" | "mg" | "milligram" | "миллиграмм" | "миллиграммы" => Unit::Milligram,
            "г" | "гр" | "g" | "gram" | "грамм" | "грамма" | "граммов" => Unit::Gram,
            "кг" | "kg" | "килограмм" | "килограмма" | "килограммов" => Unit::Kilogram,
            "мл" | "ml" | "миллилитр" | "миллилитра" => Unit::Milliliter,
            "л" | "l" | "литр" | "литра" | "литров" => Unit::Liter,
            "чл" | "члн" | "tsp" | "teaspoon" | "чайнаяложка" => Unit::Teaspoon,
            "стл" | "стлн" | "tbsp" | "tablespoon" | "столоваяложка" => Unit::Tablespoon,
            "чашка" | "cup" => Unit::Cup,
            "стакан" | "glass" => Unit::Glass,
            "шт" | "штука" | "штуки" | "штук" | "pcs" | "piece" => Unit::Piece,
            "пучок" | "пучка" | "bunch" => Unit::Bunch,
            "зубчик" | "зубчика" | "clove" => Unit::Clove,
            "щепотка" | "щепотки" | "pinch" => Unit::Pinch,
            "головка" | "головки" | "head" => Unit::Head,
            "ломтик" | "ломтика" | "slice" => Unit::Slice,
            "пакет" | "пакета" | "packet" => Unit::Packet,
            "банка" | "банки" | "can" => Unit::Can,
            "порц" | "порция" | "порции" | "portion" => Unit::Portion,
            other => return Err(Error::UnknownUnit(other.to_string())),
        };
        Ok(unit)
    }
}

/// Контекст перевода: плотность (г/мл) и вес одной счётной единицы.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct ConversionContext {
    pub density_g_per_ml: Option<f64>,
    pub piece_weight_g: Option<f64>,
    pub portion_weight_g: Option<f64>,
}

impl ConversionContext {
    pub fn mass_only() -> Self {
        Self::default()
    }

    pub fn with_density(density_g_per_ml: f64) -> Self {
        Self {
            density_g_per_ml: Some(density_g_per_ml),
            ..Self::default()
        }
    }

    pub fn with_piece(piece_weight_g: f64) -> Self {
        Self {
            piece_weight_g: Some(piece_weight_g),
            ..Self::default()
        }
    }

    pub fn grams_per_unit(&self, unit: Unit) -> Result<f64> {
        if let Some(g) = unit.grams() {
            return Ok(g);
        }
        if let Some(ml) = unit.milliliters() {
            let density = self.density_g_per_ml.ok_or_else(|| Error::Conversion {
                from: unit.code().to_string(),
                to: "г".to_string(),
                reason: "нет плотности продукта".to_string(),
            })?;
            if density <= 0.0 {
                return Err(Error::Conversion {
                    from: unit.code().to_string(),
                    to: "г".to_string(),
                    reason: "плотность должна быть больше нуля".to_string(),
                });
            }
            return Ok(ml * density);
        }
        if unit == Unit::Portion {
            return self.portion_weight_g.ok_or_else(|| Error::Conversion {
                from: unit.code().to_string(),
                to: "г".to_string(),
                reason: "нет веса порции".to_string(),
            });
        }
        self.piece_weight_g.ok_or_else(|| Error::Conversion {
            from: unit.code().to_string(),
            to: "г".to_string(),
            reason: "нет веса штуки / упаковки".to_string(),
        })
    }
}

pub fn convert(value: f64, from: Unit, to: Unit, ctx: ConversionContext) -> Result<f64> {
    if !value.is_finite() || value < 0.0 {
        return Err(Error::InvalidQuantity(format!("{value}")));
    }
    if from == to {
        return Ok(value);
    }
    let grams = value * ctx.grams_per_unit(from)?;
    let per_to = ctx.grams_per_unit(to)?;
    if per_to == 0.0 {
        return Err(Error::Conversion {
            from: from.code().to_string(),
            to: to.code().to_string(),
            reason: "нулевой знаменатель".to_string(),
        });
    }
    Ok(grams / per_to)
}

pub fn to_grams(value: f64, unit: Unit, ctx: ConversionContext) -> Result<f64> {
    convert(value, unit, Unit::Gram, ctx)
}

pub fn from_grams(grams: f64, unit: Unit, ctx: ConversionContext) -> Result<f64> {
    convert(grams, Unit::Gram, unit, ctx)
}

/// Красивый вывод массы: 1250 г → 1,25 кг, 80 г остаётся граммами.
pub fn format_mass_grams(grams: f64) -> String {
    if !grams.is_finite() {
        return "—".to_string();
    }
    let abs = grams.abs();
    if abs >= 1000.0 {
        format_ru(grams / 1000.0, 3, "кг")
    } else if abs >= 1.0 {
        format_ru(grams, 1, "г")
    } else {
        format_ru(grams * 1000.0, 0, "мг")
    }
}

pub fn format_ru(value: f64, digits: usize, suffix: &str) -> String {
    let factor = 10_f64.powi(digits as i32);
    let rounded = (value * factor).round() / factor;
    let text = if digits == 0 {
        format!("{rounded:.0}")
    } else {
        let mut s = format!("{rounded:.digits$}");
        while s.contains('.') && s.ends_with('0') {
            s.pop();
        }
        if s.ends_with('.') {
            s.pop();
        }
        s
    };
    format!("{} {suffix}", text.replace('.', ","))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kilos_to_grams() {
        let g = convert(2.5, Unit::Kilogram, Unit::Gram, ConversionContext::mass_only()).unwrap();
        assert!((g - 2500.0).abs() < 1e-9);
    }

    #[test]
    fn oil_tablespoons() {
        let ctx = ConversionContext::with_density(0.91);
        let g = to_grams(2.0, Unit::Tablespoon, ctx).unwrap();
        assert!((g - 27.3).abs() < 0.05);
    }
}
