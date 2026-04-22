use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};

use crate::entities::{llm_model, prompt, review, user};
use crate::error::ApiError;
use crate::models::{CreateReviewRequest, ReviewResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_reviews).post(create_review))
}

async fn list_reviews(
    State(state): State<AppState>,
    Path(prompt_id): Path<i32>,
) -> Result<Json<Vec<ReviewResponse>>, ApiError> {
    if prompt_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id must be a positive integer".to_string(),
        ));
    }

    prompt::Entity::find_by_id(prompt_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    let records = review::Entity::find()
        .filter(review::Column::PromptId.eq(prompt_id))
        .order_by_desc(review::Column::CreatedAt)
        .all(&state.database)
        .await?;
    let mut response = Vec::with_capacity(records.len());

    for record in records {
        response.push(build_review_response(&state, record).await?);
    }

    Ok(Json(response))
}

async fn create_review(
    State(state): State<AppState>,
    Path(prompt_id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<CreateReviewRequest>,
) -> Result<(StatusCode, Json<ReviewResponse>), ApiError> {
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

    if payload.llm_model_id <= 0 {
        return Err(ApiError::Validation(
            "llm_model_id must be a positive integer".to_string(),
        ));
    }

    let reviewer_id = super::auth::current_user_id_from_headers(&state, &headers)?;

    prompt::Entity::find_by_id(prompt_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    llm_model::Entity::find_by_id(payload.llm_model_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("llm_model_id must reference an existing model".to_string()))?;

    let created = review::ActiveModel {
        prompt_id: Set(prompt_id),
        reviewer_id: Set(reviewer_id),
        llm_model_id: Set(payload.llm_model_id),
        stars: Set(payload.stars),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(build_review_response(&state, created).await?),
    ))
}

pub async fn build_review_response(
    state: &AppState,
    record: review::Model,
) -> Result<ReviewResponse, ApiError> {
    let reviewer = user::Entity::find_by_id(record.reviewer_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(ReviewResponse {
        id: record.id,
        stars: record.stars,
        reviewer_name: reviewer.username,
        llm_model: super::llm_models::build_llm_model_response(
            state,
            llm_model::Entity::find_by_id(record.llm_model_id)
                .one(&state.database)
                .await?
                .ok_or(ApiError::NotFound)?,
        )
        .await?,
        created_at: record.created_at,
    })
}