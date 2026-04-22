use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};

use crate::entities::{llm_framework, llm_model};
use crate::error::ApiError;
use crate::models::{CreateLlmModelRequest, ListLlmModelsQuery, LlmFrameworkSummaryResponse, LlmModelResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_llm_models).post(create_llm_model))
}

async fn list_llm_models(
    State(state): State<AppState>,
    Query(query): Query<ListLlmModelsQuery>,
) -> Result<Json<Vec<LlmModelResponse>>, ApiError> {
    let mut finder = llm_model::Entity::find();

    if let Some(framework_id) = query.framework_id {
        if framework_id <= 0 {
            return Err(ApiError::Validation(
                "framework_id must be a positive integer".to_string(),
            ));
        }

        finder = finder.filter(llm_model::Column::FrameworkId.eq(framework_id));
    }

    let records = finder.all(&state.database).await?;
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

    if payload.framework_id <= 0 {
        return Err(ApiError::Validation(
            "framework_id must be a positive integer".to_string(),
        ));
    }

    let framework = llm_framework::Entity::find_by_id(payload.framework_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("framework_id must reference an existing framework".to_string()))?;

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "model name must contain letters or numbers".to_string(),
        ));
    }

    let existing = llm_model::Entity::find()
        .filter(llm_model::Column::FrameworkId.eq(payload.framework_id))
        .filter(llm_model::Column::Slug.eq(slug.clone()))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "a model with that name already exists in this framework".to_string(),
        ));
    }

    let created = llm_model::ActiveModel {
        creator_id: Set(creator_id),
        framework_id: Set(payload.framework_id),
        name: Set(name),
        slug: Set(slug),
        thinking_effort: Set(payload.thinking_effort.into()),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(LlmModelResponse {
            id: created.id,
            name: created.name,
            slug: created.slug,
            thinking_effort: created.thinking_effort.into(),
            framework: LlmFrameworkSummaryResponse {
                id: framework.id,
                name: framework.name,
                slug: framework.slug,
            },
        }),
    ))
}

pub async fn build_llm_model_response(
    state: &AppState,
    record: llm_model::Model,
) -> Result<LlmModelResponse, ApiError> {
    let framework = llm_framework::Entity::find_by_id(record.framework_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(LlmModelResponse {
        id: record.id,
        name: record.name,
        slug: record.slug,
        thinking_effort: record.thinking_effort.into(),
        framework: LlmFrameworkSummaryResponse {
            id: framework.id,
            name: framework.name,
            slug: framework.slug,
        },
    })
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