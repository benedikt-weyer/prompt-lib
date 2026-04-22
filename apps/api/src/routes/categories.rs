use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};

use crate::entities::{category, prompt};
use crate::error::ApiError;
use crate::models::{CategoryResponse, CreateCategoryRequest};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(list_categories).post(create_category))
}

async fn list_categories(State(state): State<AppState>) -> Result<Json<Vec<CategoryResponse>>, ApiError> {
    let records = category::Entity::find().all(&state.database).await?;
    let mut response = Vec::with_capacity(records.len());

    for record in records {
        let prompt_count = prompt::Entity::find()
            .filter(prompt::Column::CategoryId.eq(record.id))
            .count(&state.database)
            .await?;

        response.push(CategoryResponse {
            id: record.id,
            name: record.name,
            slug: record.slug,
            description: record.description,
            prompt_count,
        });
    }

    Ok(Json(response))
}

async fn create_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<(StatusCode, Json<CategoryResponse>), ApiError> {
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
            "category name is required".to_string(),
        ));
    }

    let slug = slugify(&name);

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "category name must contain letters or numbers".to_string(),
        ));
    }

    let existing = category::Entity::find()
        .filter(category::Column::Slug.eq(slug.clone()))
        .one(&state.database)
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict(
            "a category with that name already exists".to_string(),
        ));
    }

    let created = category::ActiveModel {
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
        Json(CategoryResponse {
            id: created.id,
            name: created.name,
            slug: created.slug,
            description: created.description,
            prompt_count: 0,
        }),
    ))
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