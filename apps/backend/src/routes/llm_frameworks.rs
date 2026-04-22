use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};

use crate::entities::llm_framework;
use crate::error::ApiError;
use crate::models::{CreateLlmFrameworkRequest, LlmFrameworkResponse};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_llm_frameworks).post(create_llm_framework))
}

async fn list_llm_frameworks(
    State(state): State<AppState>,
) -> Result<Json<Vec<LlmFrameworkResponse>>, ApiError> {
    let records = llm_framework::Entity::find().all(&state.database).await?;
    let mut response = Vec::with_capacity(records.len());

    for record in records {
        response.push(build_framework_response(&state, record).await?);
    }

    Ok(Json(response))
}

async fn create_llm_framework(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateLlmFrameworkRequest>,
) -> Result<(StatusCode, Json<LlmFrameworkResponse>), ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let name = payload.name.trim().to_string();
    let description = payload
        .description
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned);

    if name.is_empty() {
        return Err(ApiError::Validation(
            "framework name is required".to_string(),
        ));
    }

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "framework name must contain letters or numbers".to_string(),
        ));
    }

    let existing = llm_framework::Entity::find()
        .filter(llm_framework::Column::Slug.eq(slug.clone()))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "an LLM framework with that name already exists".to_string(),
        ));
    }

    let created = llm_framework::ActiveModel {
        creator_id: Set(creator_id),
        name: Set(name),
        slug: Set(slug),
        description: Set(description),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(LlmFrameworkResponse {
            id: created.id,
            name: created.name,
            slug: created.slug,
            description: created.description,
            model_count: 0,
        }),
    ))
}

pub async fn build_framework_response(
    _state: &AppState,
    record: llm_framework::Model,
) -> Result<LlmFrameworkResponse, ApiError> {
    Ok(LlmFrameworkResponse {
        id: record.id,
        name: record.name,
        slug: record.slug,
        description: record.description,
        model_count: 0,
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