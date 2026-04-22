use axum::extract::Path;
use axum::routing::get;
use axum::{Json, Router};

use crate::error::ApiError;
use crate::models::{CreateReviewRequest, FeatureStatusResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_reviews).post(create_review))
}

async fn list_reviews(Path(prompt_id): Path<i32>) -> Result<Json<Vec<serde_json::Value>>, ApiError> {
    if prompt_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id must be a positive integer".to_string(),
        ));
    }

    Ok(Json(vec![]))
}

async fn create_review(
    Path(prompt_id): Path<i32>,
    Json(payload): Json<CreateReviewRequest>,
) -> Result<Json<FeatureStatusResponse>, ApiError> {
    if prompt_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id must be a positive integer".to_string(),
        ));
    }

    if !(1..=10).contains(&payload.stars) {
        return Err(ApiError::Validation(
            "stars must be between 1 and 10".to_string(),
        ));
    }

    if payload.llm_model_name.trim().is_empty() || payload.llm_framework.trim().is_empty() {
        return Err(ApiError::Validation(
            "llm_model_name and llm_framework are required".to_string(),
        ));
    }

    let _thinking_effort = payload.thinking_effort;

    Err(ApiError::NotImplemented(
        "review persistence is the next backend milestone",
    ))
}