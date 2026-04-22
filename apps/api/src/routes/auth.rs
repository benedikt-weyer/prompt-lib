use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};

use crate::error::ApiError;
use crate::models::{FeatureStatusResponse, LoginRequest, RegisterRequest};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<FeatureStatusResponse>, ApiError> {
    if payload.username.trim().is_empty() || payload.email.trim().is_empty() || payload.password.len() < 8 {
        return Err(ApiError::Validation(
            "username, email, and a password of at least 8 characters are required".to_string(),
        ));
    }

    let _jwt_secret = &state.config.jwt_secret;

    Err(ApiError::NotImplemented(
        "registration persistence and JWT issuance are the next backend milestone",
    ))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<FeatureStatusResponse>, ApiError> {
    if payload.email.trim().is_empty() || payload.password.is_empty() {
        return Err(ApiError::Validation(
            "email and password are required".to_string(),
        ));
    }

    let _jwt_secret = &state.config.jwt_secret;

    Err(ApiError::NotImplemented(
        "credential verification and cookie-based JWT sessions are the next backend milestone",
    ))
}