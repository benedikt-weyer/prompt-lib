use axum::extract::Path;
use axum::routing::get;
use axum::{Json, Router};

use crate::error::ApiError;
use crate::models::{CreatePromptRequest, FeatureStatusResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_prompts).post(create_prompt))
        .route("/{prompt_id}", get(get_prompt))
        .nest("/{prompt_id}/reviews", super::reviews::router())
}

async fn list_prompts() -> Json<Vec<serde_json::Value>> {
    Json(vec![])
}

async fn create_prompt(
    Json(payload): Json<CreatePromptRequest>,
) -> Result<Json<FeatureStatusResponse>, ApiError> {
    if payload.name.trim().is_empty() || payload.prompt.trim().is_empty() {
        return Err(ApiError::Validation(
            "prompt name and prompt body are required".to_string(),
        ));
    }

    if payload.category_id <= 0 {
        return Err(ApiError::Validation(
            "category_id must be a positive integer".to_string(),
        ));
    }

    Err(ApiError::NotImplemented(
        "prompt persistence is the next backend milestone",
    ))
}

async fn get_prompt(Path(prompt_id): Path<i32>) -> Result<Json<serde_json::Value>, ApiError> {
    if prompt_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id must be a positive integer".to_string(),
        ));
    }

    Err(ApiError::NotImplemented(
        "prompt detail loading is the next backend milestone",
    ))
}