use axum::routing::get;
use axum::{Json, Router};

use crate::error::ApiError;
use crate::models::{CreateCategoryRequest, FeatureStatusResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_categories).post(create_category))
}

async fn list_categories() -> Json<Vec<serde_json::Value>> {
    Json(vec![])
}

async fn create_category(
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<Json<FeatureStatusResponse>, ApiError> {
    if payload.name.trim().is_empty() {
        return Err(ApiError::Validation(
            "category name is required".to_string(),
        ));
    }

    let _normalized_description = payload
        .description
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    Err(ApiError::NotImplemented(
        "category persistence is the next backend milestone",
    ))
}