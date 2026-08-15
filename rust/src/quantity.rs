use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};
use crate::units::{self, ConversionContext, Unit};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Quantity {
    pub value: f64,
    pub unit: Unit,
}

impl Quantity {
    pub fn new(value: f64, unit: Unit) -> Result<Self> {
        if !value.is_finite() || value < 0.0 {
            return Err(Error::InvalidQuantity(format!("{value}")));
        }
        Ok(Self { value, unit })
    }

    pub fn grams(value: f64) -> Result<Self> {
        Self::new(value, Unit::Gram)
    }

    pub fn kilograms(value: f64) -> Result<Self> {
        Self::new(value, Unit::Kilogram)
    }

    pub fn zero(unit: Unit) -> Self {
        Self { value: 0.0, unit }
    }

    pub fn is_zero(self) -> bool {
        self.value == 0.0
    }

    pub fn to_grams(self, ctx: ConversionContext) -> Result<f64> {
        units::to_grams(self.value, self.unit, ctx)
    }

    pub fn convert(self, to: Unit, ctx: ConversionContext) -> Result<Self> {
        Ok(Self {
            value: units::convert(self.value, self.unit, to, ctx)?,
            unit: to,
        })
    }

    pub fn scale(self, factor: f64) -> Result<Self> {
        if !factor.is_finite() || factor < 0.0 {
            return Err(Error::InvalidQuantity(format!("factor {factor}")));
        }
        Ok(Self {
            value: self.value * factor,
            unit: self.unit,
        })
    }

    pub fn add(self, other: Quantity, ctx: ConversionContext) -> Result<Self> {
        let a = self.to_grams(ctx)?;
        let b = other.to_grams(ctx)?;
        Self::grams(a + b)?.convert(self.unit, ctx)
    }

    pub fn display(self) -> String {
        units::format_ru(self.value, 3, self.unit.code())
    }
}

/// Набор количеств одной сущности на разных стадиях обработки.
#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize, Deserialize)]
pub struct WeightTriple {
    /// Вес сырья (брутто), г.
    pub gross_g: f64,
    /// Вес после холодной обработки (нетто), г.
    pub net_g: f64,
    /// Вес после тепловой обработки (выход), г.
    pub yield_g: f64,
}

impl WeightTriple {
    pub fn zero() -> Self {
        Self::default()
    }

    pub fn add(self, other: Self) -> Self {
        Self {
            gross_g: self.gross_g + other.gross_g,
            net_g: self.net_g + other.net_g,
            yield_g: self.yield_g + other.yield_g,
        }
    }

    pub fn scale(self, factor: f64) -> Self {
        Self {
            gross_g: self.gross_g * factor,
            net_g: self.net_g * factor,
            yield_g: self.yield_g * factor,
        }
    }

    pub fn cold_loss_g(self) -> f64 {
        (self.gross_g - self.net_g).max(0.0)
    }

    pub fn hot_loss_g(self) -> f64 {
        (self.net_g - self.yield_g).max(0.0)
    }

    pub fn cold_loss_percent(self) -> f64 {
        percent(self.cold_loss_g(), self.gross_g)
    }

    pub fn hot_loss_percent(self) -> f64 {
        percent(self.hot_loss_g(), self.net_g)
    }

    pub fn total_yield_percent(self) -> f64 {
        percent(self.yield_g, self.gross_g)
    }
}

fn percent(part: f64, whole: f64) -> f64 {
    if whole.abs() < 1e-9 {
        0.0
    } else {
        part / whole * 100.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_mixed_units() {
        let a = Quantity::kilograms(1.0).unwrap();
        let b = Quantity::grams(250.0).unwrap();
        let sum = a.add(b, ConversionContext::mass_only()).unwrap();
        assert!((sum.to_grams(ConversionContext::mass_only()).unwrap() - 1250.0).abs() < 1e-6);
    }
}
