use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::{get, patch};
use axum::{Json, Router};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, Set};

use crate::entities::{category, prompt, review, user};
use crate::error::ApiError;
use crate::models::{
    CategoryResponse, CreatePromptRequest, PromptExecutionType, PromptResponse,
    UpdatePromptRequest, UpdatePromptVisibilityRequest,
};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_prompts).post(create_prompt))
    .route("/{prompt_id}", patch(update_prompt).delete(delete_prompt))
        .route("/{prompt_id}/visibility", patch(update_prompt_visibility))
        .route("/slug/{slug}", get(get_prompt))
        .nest("/{prompt_id}/reviews", super::reviews::router())
}

pub(crate) fn visible_prompt_condition(viewer_user_id: Option<i32>) -> Condition {
    match viewer_user_id {
        Some(viewer_user_id) => Condition::any()
            .add(prompt::Column::IsPublic.eq(true))
            .add(prompt::Column::CreatorId.eq(viewer_user_id)),
        None => Condition::all().add(prompt::Column::IsPublic.eq(true)),
    }
}

pub(crate) async fn find_visible_prompt_by_id(
    state: &AppState,
    prompt_id: i32,
    viewer_user_id: Option<i32>,
) -> Result<prompt::Model, ApiError> {
    prompt::Entity::find_by_id(prompt_id)
        .filter(visible_prompt_condition(viewer_user_id))
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)
}

async fn list_prompts(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<PromptResponse>>, ApiError> {
    let viewer_user_id = super::auth::optional_current_user_id_from_headers(&state, &headers);
    let records = prompt::Entity::find()
        .filter(visible_prompt_condition(viewer_user_id))
        .order_by_desc(prompt::Column::UpdatedAt)
        .all(&state.database)
        .await?;
    let mut response = Vec::with_capacity(records.len());

    for record in records {
        response.push(build_prompt_response(&state, record, viewer_user_id).await?);
    }

    Ok(Json(response))
}

async fn create_prompt(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePromptRequest>,
) -> Result<(StatusCode, Json<PromptResponse>), ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let name = payload.name.trim().to_string();
    let prompt_body = payload.prompt.trim().to_string();

    if name.is_empty() || prompt_body.is_empty() {
        return Err(ApiError::Validation(
            "prompt name and prompt body are required".to_string(),
        ));
    }

    if payload.category_id <= 0 {
        return Err(ApiError::Validation(
            "category_id must be a positive integer".to_string(),
        ));
    }

    category::Entity::find_by_id(payload.category_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("category_id must reference an existing category".to_string()))?;

    let slug = unique_prompt_slug(&state, &name).await?;

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "prompt name must contain letters or numbers".to_string(),
        ));
    }

    let created = prompt::ActiveModel {
        creator_id: Set(creator_id),
        category_id: Set(payload.category_id),
        name: Set(name),
        slug: Set(slug),
        prompt: Set(prompt_body),
        execution_type: Set(payload.execution_type.as_str().to_string()),
        is_public: Set(payload.is_public),
        created_at: Set(Utc::now()),
        updated_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(build_prompt_response(&state, created, Some(creator_id)).await?),
    ))
}

async fn update_prompt_visibility(
    State(state): State<AppState>,
    Path(prompt_id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdatePromptVisibilityRequest>,
) -> Result<Json<PromptResponse>, ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;

    let record = prompt::Entity::find_by_id(prompt_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if record.creator_id != creator_id {
        return Err(ApiError::Unauthorized);
    }

    let mut active_model = record.into_active_model();
    active_model.is_public = Set(payload.is_public);
    active_model.updated_at = Set(Utc::now());
    let updated = active_model.update(&state.database).await?;

    Ok(Json(build_prompt_response(&state, updated, Some(creator_id)).await?))
}

async fn update_prompt(
    State(state): State<AppState>,
    Path(prompt_id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdatePromptRequest>,
) -> Result<Json<PromptResponse>, ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;
    let name = payload.name.trim().to_string();
    let prompt_body = payload.prompt.trim().to_string();

    if name.is_empty() || prompt_body.is_empty() {
        return Err(ApiError::Validation(
            "prompt name and prompt body are required".to_string(),
        ));
    }

    if payload.category_id <= 0 {
        return Err(ApiError::Validation(
            "category_id must be a positive integer".to_string(),
        ));
    }

    category::Entity::find_by_id(payload.category_id)
        .one(&state.database)
        .await?
        .ok_or_else(|| ApiError::Validation("category_id must reference an existing category".to_string()))?;

    let record = prompt::Entity::find_by_id(prompt_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if record.creator_id != creator_id {
        return Err(ApiError::Unauthorized);
    }

    let slug = if record.name == name {
        record.slug.clone()
    } else {
        unique_prompt_slug_for_update(&state, &name, record.id).await?
    };

    if slug.is_empty() {
        return Err(ApiError::Validation(
            "prompt name must contain letters or numbers".to_string(),
        ));
    }

    let mut active_model = record.into_active_model();
    active_model.category_id = Set(payload.category_id);
    active_model.name = Set(name);
    active_model.slug = Set(slug);
    active_model.prompt = Set(prompt_body);
    active_model.execution_type = Set(payload.execution_type.as_str().to_string());
    active_model.is_public = Set(payload.is_public);
    active_model.updated_at = Set(Utc::now());
    let updated = active_model.update(&state.database).await?;

    Ok(Json(build_prompt_response(&state, updated, Some(creator_id)).await?))
}

async fn delete_prompt(
    State(state): State<AppState>,
    Path(prompt_id): Path<i32>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    let creator_id = super::auth::current_user_id_from_headers(&state, &headers)?;

    let record = prompt::Entity::find_by_id(prompt_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    if record.creator_id != creator_id {
        return Err(ApiError::Unauthorized);
    }

    let active_model = record.into_active_model();
    active_model.delete(&state.database).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn get_prompt(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(slug): Path<String>,
) -> Result<Json<PromptResponse>, ApiError> {
    let viewer_user_id = super::auth::optional_current_user_id_from_headers(&state, &headers);
    let record = prompt::Entity::find()
        .filter(prompt::Column::Slug.eq(slug))
        .filter(visible_prompt_condition(viewer_user_id))
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(Json(build_prompt_response(&state, record, viewer_user_id).await?))
}

async fn build_prompt_response(
    state: &AppState,
    record: prompt::Model,
    viewer_user_id: Option<i32>,
) -> Result<PromptResponse, ApiError> {
    let category_record = category::Entity::find_by_id(record.category_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;
    let author = user::Entity::find_by_id(record.creator_id)
        .one(&state.database)
        .await?
        .ok_or(ApiError::NotFound)?;
    let (review_count, average_stars) = prompt_review_metrics(state, record.id).await?;
    let prompt_count = prompt::Entity::find()
        .filter(prompt::Column::CategoryId.eq(category_record.id))
        .filter(visible_prompt_condition(viewer_user_id))
        .count(&state.database)
        .await?;

    Ok(PromptResponse {
        id: record.id,
        creator_id: record.creator_id,
        name: record.name,
        slug: record.slug,
        prompt: record.prompt,
        execution_type: PromptExecutionType::from_db(&record.execution_type),
        is_public: record.is_public,
        author_name: author.username,
        category: CategoryResponse {
            id: category_record.id,
            parent_category_id: category_record.parent_category_id,
            name: category_record.name,
            slug: category_record.slug,
            description: category_record.description,
            prompt_count,
        },
        review_count,
        average_stars,
    })
}

async fn prompt_review_metrics(state: &AppState, prompt_id: i32) -> Result<(u64, Option<f64>), ApiError> {
    let records = review::Entity::find()
        .filter(review::Column::PromptId.eq(prompt_id))
        .all(&state.database)
        .await?;
    let review_count = records.len() as u64;

    if review_count == 0 {
        return Ok((0, None));
    }

    let total_stars: i64 = records.iter().map(|record| i64::from(record.stars)).sum();
    let average = (total_stars as f64 / review_count as f64 * 10.0).round() / 10.0;

    Ok((review_count, Some(average)))
}

async fn unique_prompt_slug(state: &AppState, name: &str) -> Result<String, ApiError> {
    let base = slugify(name);

    if base.is_empty() {
        return Ok(base);
    }

    let mut candidate = base.clone();
    let mut counter = 2;

    while prompt::Entity::find()
        .filter(prompt::Column::Slug.eq(candidate.clone()))
        .one(&state.database)
        .await?
        .is_some()
    {
        candidate = format!("{base}-{counter}");
        counter += 1;
    }

    Ok(candidate)
}

async fn unique_prompt_slug_for_update(
    state: &AppState,
    name: &str,
    prompt_id: i32,
) -> Result<String, ApiError> {
    let base = slugify(name);

    if base.is_empty() {
        return Ok(base);
    }

    let mut candidate = base.clone();
    let mut counter = 2;

    while prompt::Entity::find()
        .filter(prompt::Column::Slug.eq(candidate.clone()))
        .filter(prompt::Column::Id.ne(prompt_id))
        .one(&state.database)
        .await?
        .is_some()
    {
        candidate = format!("{base}-{counter}");
        counter += 1;
    }

    Ok(candidate)
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