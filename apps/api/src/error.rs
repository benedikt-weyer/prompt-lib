use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use sea_orm::DbErr;
use serde::Serialize;
use thiserror::Error;

#[allow(dead_code)]
#[derive(Debug, Error)]
pub enum ApiError {
    #[error("resource not found")]
    NotFound,
    #[error("unauthorized")]
    Unauthorized,
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("database error")]
    Database(#[from] DbErr),
    #[error("feature not implemented: {0}")]
    NotImplemented(&'static str),
    #[error("internal server error")]
    Internal,
}

#[derive(Serialize)]
struct ErrorBody<'a> {
    error: &'a str,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match self {
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Validation(_) => StatusCode::BAD_REQUEST,
            Self::Database(_) | Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NotImplemented(_) => StatusCode::NOT_IMPLEMENTED,
        };

        let error = match status {
            StatusCode::NOT_FOUND => "not_found",
            StatusCode::UNAUTHORIZED => "unauthorized",
            StatusCode::BAD_REQUEST => "validation_error",
            StatusCode::NOT_IMPLEMENTED => "not_implemented",
            _ => "internal_error",
        };

        let body = ErrorBody {
            error,
            message: self.to_string(),
        };

        (status, Json(body)).into_response()
    }
}