use serde::{Deserialize, Serialize};
use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Error, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "message")]
pub enum Error {
    #[error("продукт не найден: {0}")]
    ProductNotFound(String),
    #[error("блюдо не найдено: {0}")]
    DishNotFound(String),
    #[error("меню не найдено: {0}")]
    MenuNotFound(String),
    #[error("строка блюда пустая")]
    EmptyDishLine,
    #[error("неизвестная единица: {0}")]
    UnknownUnit(String),
    #[error("нельзя перевести {from} в {to}: {reason}")]
    Conversion {
        from: String,
        to: String,
        reason: String,
    },
    #[error("некорректное количество: {0}")]
    InvalidQuantity(String),
    #[error("некорректное число порций: {0}")]
    InvalidPortions(f64),
    #[error("некорректный коэффициент выхода: {0}")]
    InvalidYield(f64),
    #[error("у продукта {0} нет плотности для перевода объёма в массу")]
    MissingDensity(String),
    #[error("у продукта {0} нет веса штуки")]
    MissingPieceWeight(String),
    #[error("цикл в составе полуфабриката: {0}")]
    CyclicSemiFinished(String),
    #[error("валидация: {0}")]
    Validation(String),
    #[error("разбор JSON: {0}")]
    Json(String),
    #[error("ввод-вывод: {0}")]
    Io(String),
    #[error("неизвестная команда: {0}")]
    UnknownCommand(String),
    #[error("{0}")]
    Other(String),
}

impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Error::Json(value.to_string())
    }
}

impl From<std::io::Error> for Error {
    fn from(value: std::io::Error) -> Self {
        Error::Io(value.to_string())
    }
}
