use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait,
    ColumnTrait,
    EntityTrait,
    IntoActiveModel,
    PaginatorTrait,
    QueryFilter,
    QueryOrder,
    Set,
};

use crate::entities::{llm_model, llm_model_thinking_effort, review};
use crate::error::ApiError;
use crate::models::{
    CreateLlmModelRequest,
    CreateLlmModelThinkingEffortRequest,
    LlmModelResponse,
    LlmModelSummaryResponse,
    LlmModelThinkingEffortResponse,
    UpdateLlmModelRequest,
};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_llm_models).post(create_llm_model))
        .route("/slug/{slug}", get(get_llm_model_by_slug))
        .route("/{model_id}", axum::routing::patch(update_llm_model))
        .route("/{model_id}/thinking-efforts", axum::routing::post(create_llm_model_thinking_effort))
        .route(
            "/{model_id}/thinking-efforts/{effort_id}",
            axum::routing::delete(delete_llm_model_thinking_effort),
        )
}

async fn list_llm_models(
    State(state): State<AppState>,
) -> Result<Json<Vec<LlmModelResponse>>, ApiError> {
    let records = llm_model::Entity::find().all(&state.database).await?;
    let mut response = Vec::with_capacity(records.len());

    for record in records {
        response.push(build_llm_model_response(&state, record).await?);
    }

    Ok(Json(response))
}

async fn create_llm_model(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateLlmModelRequest>,
) -> Result<(StatusCode, Json<LlmModelResponse>), ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let name = payload.name.trim().to_string();

    if name.is_empty() {
        return Err(ApiError::Validation("model name is required".to_string()));
    }

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "model name must contain letters or numbers".to_string(),
        ));
    }

    let existing = llm_model::Entity::find()
        .filter(llm_model::Column::Slug.eq(slug.clone()))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "a model with that name already exists".to_string(),
        ));
    }

    let created = llm_model::ActiveModel {
        creator_id: Set(creator_id),
        name: Set(name),
        slug: Set(slug),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    seed_default_thinking_efforts(&state, created.id).await?;

    Ok((StatusCode::CREATED, Json(build_llm_model_response(&state, created).await?)))
}

async fn get_llm_model_by_slug(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<LlmModelResponse>, ApiError> {
    let record = llm_model::Entity::find()
        .filter(llm_model::Column::Slug.eq(slug))
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(Json(build_llm_model_response(&state, record).await?))
}

async fn update_llm_model(
    State(state): State<AppState>,
    Path(model_id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateLlmModelRequest>,
) -> Result<Json<LlmModelResponse>, ApiError> {
    if model_id <= 0 {
        return Err(ApiError::Validation("model_id must be a positive integer".to_string()));
    }

    let current_user_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let record = llm_model::Entity::find_by_id(model_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if record.creator_id != current_user_id {
        return Err(ApiError::Unauthorized);
    }

    let name = payload.name.trim().to_string();

    if name.is_empty() {
        return Err(ApiError::Validation("model name is required".to_string()));
    }

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "model name must contain letters or numbers".to_string(),
        ));
    }

    let existing = llm_model::Entity::find()
        .filter(llm_model::Column::Slug.eq(slug.clone()))
        .filter(llm_model::Column::Id.ne(model_id))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "a model with that name already exists".to_string(),
        ));
    }

    let mut active_model = record.into_active_model();
    active_model.name = Set(name);
    active_model.slug = Set(slug);
    let updated = active_model.update(&state.database).await?;

    Ok(Json(build_llm_model_response(&state, updated).await?))
}

async fn create_llm_model_thinking_effort(
    State(state): State<AppState>,
    Path(model_id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<CreateLlmModelThinkingEffortRequest>,
) -> Result<(StatusCode, Json<LlmModelThinkingEffortResponse>), ApiError> {
    if model_id <= 0 {
        return Err(ApiError::Validation("model_id must be a positive integer".to_string()));
    }

    let current_user_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let model = llm_model::Entity::find_by_id(model_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if model.creator_id != current_user_id {
        return Err(ApiError::Unauthorized);
    }

    let name = payload.name.trim().to_string();

    if name.is_empty() {
        return Err(ApiError::Validation("thinking effort name is required".to_string()));
    }

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "thinking effort name must contain letters or numbers".to_string(),
        ));
    }

    let existing = llm_model_thinking_effort::Entity::find()
        .filter(llm_model_thinking_effort::Column::LlmModelId.eq(model_id))
        .filter(llm_model_thinking_effort::Column::Slug.eq(slug.clone()))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "that thinking effort already exists for this model".to_string(),
        ));
    }

    let created = llm_model_thinking_effort::ActiveModel {
        llm_model_id: Set(model_id),
        name: Set(name),
        slug: Set(slug),
        is_default: Set(false),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    Ok((StatusCode::CREATED, Json(build_thinking_effort_response(created))))
}

async fn delete_llm_model_thinking_effort(
    State(state): State<AppState>,
    Path((model_id, effort_id)): Path<(i32, i32)>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    if model_id <= 0 || effort_id <= 0 {
        return Err(ApiError::Validation(
            "model_id and effort_id must be positive integers".to_string(),
        ));
    }

    let current_user_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let model = llm_model::Entity::find_by_id(model_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if model.creator_id != current_user_id {
        return Err(ApiError::Unauthorized);
    }

    let effort = llm_model_thinking_effort::Entity::find_by_id(effort_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if effort.llm_model_id != model_id {
        return Err(ApiError::Validation(
            "thinking effort does not belong to this model".to_string(),
        ));
    }

    if effort.is_default {
        return Err(ApiError::Validation(
            "default thinking efforts cannot be deleted".to_string(),
        ));
    }

    let review_count = review::Entity::find()
        .filter(review::Column::LlmModelThinkingEffortId.eq(effort_id))
        .count(&state.database)
        .await?;

    if review_count > 0 {
        return Err(ApiError::Conflict(
            "that thinking effort is already used by reviews".to_string(),
        ));
    }

    llm_model_thinking_effort::Entity::delete_by_id(effort_id)
        .exec(&state.database)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn build_llm_model_response(
    state: &AppState,
    record: llm_model::Model,
) -> Result<LlmModelResponse, ApiError> {
    let thinking_efforts = llm_model_thinking_effort::Entity::find()
        .filter(llm_model_thinking_effort::Column::LlmModelId.eq(record.id))
        .order_by_desc(llm_model_thinking_effort::Column::IsDefault)
        .order_by_asc(llm_model_thinking_effort::Column::CreatedAt)
        .all(&state.database)
        .await?
        .into_iter()
        .map(build_thinking_effort_response)
        .collect();

    Ok(LlmModelResponse {
        id: record.id,
        creator_id: record.creator_id,
        name: record.name,
        slug: record.slug,
        thinking_efforts,
    })
}

pub fn build_llm_model_summary_response(record: &llm_model::Model) -> LlmModelSummaryResponse {
    LlmModelSummaryResponse {
        id: record.id,
        name: record.name.clone(),
        slug: record.slug.clone(),
    }
}

pub fn build_thinking_effort_response(
    record: llm_model_thinking_effort::Model,
) -> LlmModelThinkingEffortResponse {
    LlmModelThinkingEffortResponse {
        id: record.id,
        name: record.name,
        slug: record.slug,
        is_default: record.is_default,
    }
}

async fn seed_default_thinking_efforts(state: &AppState, model_id: i32) -> Result<(), ApiError> {
    for (name, slug) in [("unknown", "unknown"), ("none", "none")] {
        let existing = llm_model_thinking_effort::Entity::find()
            .filter(llm_model_thinking_effort::Column::LlmModelId.eq(model_id))
            .filter(llm_model_thinking_effort::Column::Slug.eq(slug))
            .one(&state.database)
            .await?;

        if existing.is_none() {
            llm_model_thinking_effort::ActiveModel {
                llm_model_id: Set(model_id),
                name: Set(name.to_string()),
                slug: Set(slug.to_string()),
                is_default: Set(true),
                created_at: Set(Utc::now()),
                ..Default::default()
            }
            .insert(&state.database)
            .await?;
        }
    }

    Ok(())
}

fn slugify(input: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;

    for character in input.chars().flat_map(|character| character.to_lowercase()) {
        if character.is_ascii_alphanumeric() {
            slug.push(character);
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }

    slug.trim_matches('-').to_string()
}