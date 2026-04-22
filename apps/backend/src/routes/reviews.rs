use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::{get, patch};
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter, QueryOrder, Set};

use crate::entities::{llm_framework, llm_model, llm_model_thinking_effort, review, user};
use crate::error::ApiError;
use crate::models::{CreateReviewRequest, LlmFrameworkSummaryResponse, ReviewResponse, UpdateReviewRequest};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_reviews).post(create_review))
        .route("/{review_id}", patch(update_review).delete(delete_review))
}

async fn list_reviews(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(prompt_id): Path<i32>,
) -> Result<Json<Vec<ReviewResponse>>, ApiError> {
    if prompt_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id must be a positive integer".to_string(),
        ));
    }

    let viewer_user_id = super::auth::optional_current_user_id_from_headers(&state, &headers);
    super::prompts::find_visible_prompt_by_id(&state, prompt_id, viewer_user_id).await?;

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

    let reviewer_id = super::auth::current_user_id_from_headers(&state, &headers)?;

    super::prompts::find_visible_prompt_by_id(&state, prompt_id, Some(reviewer_id)).await?;

    validate_review_payload(
        &state,
        payload.stars,
        payload.llm_model_id,
        payload.llm_framework_id,
        payload.llm_model_thinking_effort_id,
    )
    .await?;

    let created = review::ActiveModel {
        prompt_id: Set(prompt_id),
        reviewer_id: Set(reviewer_id),
        llm_model_id: Set(payload.llm_model_id),
        llm_framework_id: Set(payload.llm_framework_id),
        llm_model_thinking_effort_id: Set(payload.llm_model_thinking_effort_id),
        stars: Set(payload.stars),
        comment: Set(normalize_review_comment(payload.comment)),
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

async fn update_review(
    State(state): State<AppState>,
    Path((prompt_id, review_id)): Path<(i32, i32)>,
    headers: HeaderMap,
    Json(payload): Json<UpdateReviewRequest>,
) -> Result<Json<ReviewResponse>, ApiError> {
    if prompt_id <= 0 || review_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id and review_id must be positive integers".to_string(),
        ));
    }

    let reviewer_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    super::prompts::find_visible_prompt_by_id(&state, prompt_id, Some(reviewer_id)).await?;

    validate_review_payload(
        &state,
        payload.stars,
        payload.llm_model_id,
        payload.llm_framework_id,
        payload.llm_model_thinking_effort_id,
    )
    .await?;

    let record = find_owned_review(&state, prompt_id, review_id, reviewer_id).await?;
    let mut active_model = record.into_active_model();
    active_model.llm_model_id = Set(payload.llm_model_id);
    active_model.llm_framework_id = Set(payload.llm_framework_id);
    active_model.llm_model_thinking_effort_id = Set(payload.llm_model_thinking_effort_id);
    active_model.stars = Set(payload.stars);
    active_model.comment = Set(normalize_review_comment(payload.comment));
    let updated = active_model.update(&state.database).await?;

    Ok(Json(build_review_response(&state, updated).await?))
}

async fn delete_review(
    State(state): State<AppState>,
    Path((prompt_id, review_id)): Path<(i32, i32)>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    if prompt_id <= 0 || review_id <= 0 {
        return Err(ApiError::Validation(
            "prompt_id and review_id must be positive integers".to_string(),
        ));
    }

    let reviewer_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    super::prompts::find_visible_prompt_by_id(&state, prompt_id, Some(reviewer_id)).await?;

    let record = find_owned_review(&state, prompt_id, review_id, reviewer_id).await?;
    let active_model = record.into_active_model();
    active_model.delete(&state.database).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn find_owned_review(
    state: &AppState,
    prompt_id: i32,
    review_id: i32,
    reviewer_id: i32,
) -> Result<review::Model, ApiError> {
    let record = review::Entity::find_by_id(review_id)
        .filter(review::Column::PromptId.eq(prompt_id))
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if record.reviewer_id != reviewer_id {
        return Err(ApiError::Unauthorized);
    }

    Ok(record)
}

async fn validate_review_payload(
    state: &AppState,
    stars: i16,
    llm_model_id: i32,
    llm_framework_id: i32,
    llm_model_thinking_effort_id: i32,
) -> Result<(), ApiError> {
    if !(1..=10).contains(&stars) {
        return Err(ApiError::Validation(
            "stars must be between 1 and 10".to_string(),
        ));
    }

    if llm_model_id <= 0 {
        return Err(ApiError::Validation(
            "llm_model_id must be a positive integer".to_string(),
        ));
    }

    if llm_framework_id <= 0 {
        return Err(ApiError::Validation(
            "llm_framework_id must be a positive integer".to_string(),
        ));
    }

    if llm_model_thinking_effort_id <= 0 {
        return Err(ApiError::Validation(
            "llm_model_thinking_effort_id must be a positive integer".to_string(),
        ));
    }

    let model = llm_model::Entity::find_by_id(llm_model_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("llm_model_id must reference an existing model".to_string()))?;

    llm_framework::Entity::find_by_id(llm_framework_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("llm_framework_id must reference an existing framework".to_string()))?;

    let thinking_effort = llm_model_thinking_effort::Entity::find_by_id(llm_model_thinking_effort_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| {
            ApiError::Validation(
                "llm_model_thinking_effort_id must reference an existing thinking effort".to_string(),
            )
        })?;

    if thinking_effort.llm_model_id != model.id {
        return Err(ApiError::Validation(
            "thinking effort must belong to the selected model".to_string(),
        ));
    }

    Ok(())
}

fn normalize_review_comment(comment: Option<String>) -> Option<String> {
    comment.and_then(|value| {
        let trimmed = value.trim().to_string();

        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
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
        reviewer_id: record.reviewer_id,
        stars: record.stars,
        comment: record.comment,
        reviewer_name: reviewer.username,
        llm_model: super::llm_models::build_llm_model_summary_response(
            &llm_model::Entity::find_by_id(record.llm_model_id)
                .one(&state.database)
                .await?
                .ok_or(ApiError::NotFound)?,
        ),
        llm_framework: {
            let framework = llm_framework::Entity::find_by_id(record.llm_framework_id)
                .one(&state.database)
                .await?
                .ok_or(ApiError::NotFound)?;

            LlmFrameworkSummaryResponse {
                id: framework.id,
                name: framework.name,
                slug: framework.slug,
            }
        },
        thinking_effort: super::llm_models::build_thinking_effort_response(
            llm_model_thinking_effort::Entity::find_by_id(record.llm_model_thinking_effort_id)
                .one(&state.database)
                .await?
                .ok_or(ApiError::NotFound)?,
        ),
        created_at: record.created_at,
    })
}