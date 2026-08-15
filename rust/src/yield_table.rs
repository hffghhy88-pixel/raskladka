use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

/// Холодная обработка: очистка, разделка, снятие костей.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ColdProcess {
    None,
    Peel,
    Trim,
    Bone,
    Scale,
    Gut,
    Defrost,
    Soak,
    Custom,
}

impl ColdProcess {
    pub fn label(self) -> &'static str {
        match self {
            ColdProcess::None => "без холодной обработки",
            ColdProcess::Peel => "очистка / чистка",
            ColdProcess::Trim => "зачистка / обрезка",
            ColdProcess::Bone => "обвалка / снятие костей",
            ColdProcess::Scale => "снятие чешуи",
            ColdProcess::Gut => "потрошение",
            ColdProcess::Defrost => "разморозка",
            ColdProcess::Soak => "замачивание",
            ColdProcess::Custom => "свой коэффициент",
        }
    }

    pub fn all() -> &'static [ColdProcess] {
        &[
            ColdProcess::None,
            ColdProcess::Peel,
            ColdProcess::Trim,
            ColdProcess::Bone,
            ColdProcess::Scale,
            ColdProcess::Gut,
            ColdProcess::Defrost,
            ColdProcess::Soak,
            ColdProcess::Custom,
        ]
    }
}

/// Тепловая обработка.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HotProcess {
    None,
    Boil,
    Steam,
    Stew,
    Fry,
    DeepFry,
    Bake,
    Grill,
    Blanch,
    Saute,
    Custom,
}

impl HotProcess {
    pub fn label(self) -> &'static str {
        match self {
            HotProcess::None => "без тепловой обработки",
            HotProcess::Boil => "варка",
            HotProcess::Steam => "на пару",
            HotProcess::Stew => "тушение",
            HotProcess::Fry => "жарка",
            HotProcess::DeepFry => "во фритюре",
            HotProcess::Bake => "запекание",
            HotProcess::Grill => "гриль",
            HotProcess::Blanch => "бланширование",
            HotProcess::Saute => "пассерование",
            HotProcess::Custom => "свой коэффициент",
        }
    }

    pub fn all() -> &'static [HotProcess] {
        &[
            HotProcess::None,
            HotProcess::Boil,
            HotProcess::Steam,
            HotProcess::Stew,
            HotProcess::Fry,
            HotProcess::DeepFry,
            HotProcess::Bake,
            HotProcess::Grill,
            HotProcess::Blanch,
            HotProcess::Saute,
            HotProcess::Custom,
        ]
    }
}

/// Профиль потерь продукта. Проценты холодной потери и выхода после жарки/варки.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldProfile {
    /// Потери при холодной обработке, % от брутто.
    #[serde(default)]
    pub cold_loss: ColdLossTable,
    /// Выход после тепловой обработки, % от нетто (100 = ничего не потеряли).
    #[serde(default)]
    pub hot_yield: HotYieldTable,
}

impl Default for YieldProfile {
    fn default() -> Self {
        Self {
            cold_loss: ColdLossTable::default(),
            hot_yield: HotYieldTable::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColdLossTable {
    #[serde(default)]
    pub peel: f64,
    #[serde(default)]
    pub trim: f64,
    #[serde(default)]
    pub bone: f64,
    #[serde(default)]
    pub scale: f64,
    #[serde(default)]
    pub gut: f64,
    #[serde(default)]
    pub defrost: f64,
    #[serde(default)]
    pub soak: f64,
    #[serde(default)]
    pub custom: f64,
}

impl Default for ColdLossTable {
    fn default() -> Self {
        Self {
            peel: 0.0,
            trim: 0.0,
            bone: 0.0,
            scale: 0.0,
            gut: 0.0,
            defrost: 2.0,
            soak: 0.0,
            custom: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotYieldTable {
    #[serde(default = "hundred")]
    pub boil: f64,
    #[serde(default = "hundred")]
    pub steam: f64,
    #[serde(default = "hundred")]
    pub stew: f64,
    #[serde(default = "hundred")]
    pub fry: f64,
    #[serde(default = "hundred")]
    pub deep_fry: f64,
    #[serde(default = "hundred")]
    pub bake: f64,
    #[serde(default = "hundred")]
    pub grill: f64,
    #[serde(default = "hundred")]
    pub blanch: f64,
    #[serde(default = "hundred")]
    pub saute: f64,
    #[serde(default = "hundred")]
    pub custom: f64,
}

fn hundred() -> f64 {
    100.0
}

impl Default for HotYieldTable {
    fn default() -> Self {
        Self {
            boil: 100.0,
            steam: 100.0,
            stew: 100.0,
            fry: 100.0,
            deep_fry: 100.0,
            bake: 100.0,
            grill: 100.0,
            blanch: 100.0,
            saute: 100.0,
            custom: 100.0,
        }
    }
}

impl YieldProfile {
    pub fn cold_loss_percent(&self, process: ColdProcess) -> f64 {
        match process {
            ColdProcess::None => 0.0,
            ColdProcess::Peel => self.cold_loss.peel,
            ColdProcess::Trim => self.cold_loss.trim,
            ColdProcess::Bone => self.cold_loss.bone,
            ColdProcess::Scale => self.cold_loss.scale,
            ColdProcess::Gut => self.cold_loss.gut,
            ColdProcess::Defrost => self.cold_loss.defrost,
            ColdProcess::Soak => self.cold_loss.soak,
            ColdProcess::Custom => self.cold_loss.custom,
        }
    }

    pub fn hot_yield_percent(&self, process: HotProcess) -> f64 {
        match process {
            HotProcess::None => 100.0,
            HotProcess::Boil => self.hot_yield.boil,
            HotProcess::Steam => self.hot_yield.steam,
            HotProcess::Stew => self.hot_yield.stew,
            HotProcess::Fry => self.hot_yield.fry,
            HotProcess::DeepFry => self.hot_yield.deep_fry,
            HotProcess::Bake => self.hot_yield.bake,
            HotProcess::Grill => self.hot_yield.grill,
            HotProcess::Blanch => self.hot_yield.blanch,
            HotProcess::Saute => self.hot_yield.saute,
            HotProcess::Custom => self.hot_yield.custom,
        }
    }

    pub fn apply_cold(&self, gross_g: f64, process: ColdProcess) -> f64 {
        let loss = (self.cold_loss_percent(process) / 100.0).clamp(0.0, 1.0);
        gross_g * (1.0 - loss)
    }

    pub fn apply_hot(&self, net_g: f64, process: HotProcess) -> f64 {
        let y = (self.hot_yield_percent(process) / 100.0).max(0.0);
        net_g * y
    }

    pub fn validate(&self, product_name: &str) -> Result<()> {
        let colds = [
            ("очистка", self.cold_loss.peel),
            ("зачистка", self.cold_loss.trim),
            ("обвалка", self.cold_loss.bone),
            ("чешуя", self.cold_loss.scale),
            ("потрошение", self.cold_loss.gut),
            ("разморозка", self.cold_loss.defrost),
            ("замачивание", self.cold_loss.soak),
            ("свой хол.", self.cold_loss.custom),
        ];
        for (label, value) in colds {
            if !(0.0..=95.0).contains(&value) {
                return Err(Error::InvalidYield(value).into_validation(product_name, label));
            }
        }
        let hots = [
            ("варка", self.hot_yield.boil),
            ("пар", self.hot_yield.steam),
            ("тушение", self.hot_yield.stew),
            ("жарка", self.hot_yield.fry),
            ("фритюр", self.hot_yield.deep_fry),
            ("духовка", self.hot_yield.bake),
            ("гриль", self.hot_yield.grill),
            ("бланш", self.hot_yield.blanch),
            ("пассеровка", self.hot_yield.saute),
            ("свой тепл.", self.hot_yield.custom),
        ];
        for (label, value) in hots {
            if !(20.0..=250.0).contains(&value) {
                return Err(Error::InvalidYield(value).into_validation(product_name, label));
            }
        }
        Ok(())
    }
}

trait IntoValidation {
    fn into_validation(self, product: &str, field: &str) -> Error;
}

impl IntoValidation for Error {
    fn into_validation(self, product: &str, field: &str) -> Error {
        Error::Validation(format!("{product}: {field}: {self}"))
    }
}

/// Типовые профили по сборникам рецептур общепита (округлённо).
pub fn typical_vegetable_root() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            peel: 25.0,
            trim: 8.0,
            custom: 25.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 97.0,
            steam: 98.0,
            stew: 82.0,
            fry: 69.0,
            deep_fry: 60.0,
            bake: 78.0,
            grill: 75.0,
            blanch: 96.0,
            saute: 80.0,
            custom: 85.0,
        },
    }
}

pub fn typical_onion() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            peel: 16.0,
            trim: 10.0,
            custom: 16.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 92.0,
            stew: 50.0,
            fry: 48.0,
            saute: 50.0,
            bake: 70.0,
            custom: 60.0,
            ..HotYieldTable {
                boil: 92.0,
                steam: 95.0,
                stew: 50.0,
                fry: 48.0,
                deep_fry: 45.0,
                bake: 70.0,
                grill: 65.0,
                blanch: 94.0,
                saute: 50.0,
                custom: 60.0,
            }
        },
    }
}

pub fn typical_cabbage() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            peel: 20.0,
            trim: 15.0,
            custom: 20.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 88.0,
            stew: 78.0,
            fry: 72.0,
            bake: 80.0,
            blanch: 90.0,
            custom: 82.0,
            steam: 90.0,
            deep_fry: 65.0,
            grill: 75.0,
            saute: 74.0,
        },
    }
}

pub fn typical_meat() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            peel: 0.0,
            trim: 7.0,
            bone: 28.0,
            custom: 7.0,
            defrost: 3.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 63.0,
            steam: 68.0,
            stew: 62.0,
            fry: 63.0,
            deep_fry: 60.0,
            bake: 65.0,
            grill: 62.0,
            blanch: 85.0,
            saute: 70.0,
            custom: 63.0,
        },
    }
}

pub fn typical_poultry() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            trim: 6.0,
            bone: 32.0,
            gut: 18.0,
            defrost: 4.0,
            custom: 6.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 67.0,
            steam: 70.0,
            stew: 65.0,
            fry: 68.0,
            deep_fry: 64.0,
            bake: 70.0,
            grill: 66.0,
            blanch: 88.0,
            saute: 72.0,
            custom: 68.0,
        },
    }
}

pub fn typical_fish() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            scale: 6.0,
            gut: 22.0,
            bone: 40.0,
            trim: 12.0,
            defrost: 5.0,
            custom: 22.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 80.0,
            steam: 82.0,
            stew: 78.0,
            fry: 80.0,
            deep_fry: 75.0,
            bake: 80.0,
            grill: 78.0,
            blanch: 90.0,
            saute: 82.0,
            custom: 80.0,
        },
    }
}

pub fn typical_groats() -> YieldProfile {
    // Крупы при варке набирают воду — выход > 100% от нетто.
    YieldProfile {
        cold_loss: ColdLossTable {
            soak: 0.0,
            custom: 0.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 250.0,
            steam: 220.0,
            stew: 240.0,
            fry: 140.0,
            custom: 250.0,
            bake: 180.0,
            ..HotYieldTable {
                boil: 250.0,
                steam: 220.0,
                stew: 240.0,
                fry: 140.0,
                deep_fry: 130.0,
                bake: 180.0,
                grill: 120.0,
                blanch: 160.0,
                saute: 150.0,
                custom: 250.0,
            }
        },
    }
}

pub fn typical_pasta() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable::default(),
        hot_yield: HotYieldTable {
            boil: 230.0,
            steam: 200.0,
            stew: 210.0,
            fry: 130.0,
            custom: 230.0,
            ..HotYieldTable {
                boil: 230.0,
                steam: 200.0,
                stew: 210.0,
                fry: 130.0,
                deep_fry: 120.0,
                bake: 180.0,
                grill: 110.0,
                blanch: 170.0,
                saute: 140.0,
                custom: 230.0,
            }
        },
    }
}

pub fn typical_none() -> YieldProfile {
    YieldProfile::default()
}

pub fn typical_greens() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable {
            peel: 24.0,
            trim: 20.0,
            custom: 24.0,
            ..ColdLossTable::default()
        },
        hot_yield: HotYieldTable {
            boil: 70.0,
            stew: 55.0,
            fry: 50.0,
            saute: 52.0,
            blanch: 75.0,
            custom: 60.0,
            steam: 72.0,
            deep_fry: 45.0,
            bake: 58.0,
            grill: 50.0,
        },
    }
}

pub fn typical_dairy() -> YieldProfile {
    YieldProfile {
        cold_loss: ColdLossTable::default(),
        hot_yield: HotYieldTable {
            boil: 95.0,
            stew: 88.0,
            fry: 80.0,
            bake: 85.0,
            custom: 95.0,
            steam: 96.0,
            deep_fry: 75.0,
            grill: 78.0,
            blanch: 97.0,
            saute: 82.0,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn potato_peel_then_fry() {
        let profile = typical_vegetable_root();
        let net = profile.apply_cold(1000.0, ColdProcess::Peel);
        assert!((net - 750.0).abs() < 0.01);
        let cooked = profile.apply_hot(net, HotProcess::Fry);
        assert!((cooked - 517.5).abs() < 0.1);
    }
}
