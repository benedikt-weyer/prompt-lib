use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::State;
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, DecodingKey, EncodingKey, Header, Validation};
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

use crate::entities::user;
use crate::error::ApiError;
use crate::models::{
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    RegisterRequest,
    SessionResponse,
};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/me", get(me))
        .route("/logout", post(logout))
        .route("/register", post(register))
        .route("/login", post(login))
}

pub async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SessionResponse>, ApiError> {
    let claims = authenticate_request(&state, &headers)?;
    let user = user::Entity::find_by_id(claims.sub)
        .one(&state.database)
        .await?
        .ok_or(ApiError::Unauthorized)?;

    Ok(Json(SessionResponse {
        status: "ok",
        authenticated: true,
        user: Some(AuthUserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
        }),
    }))
}

pub async fn logout() -> Result<Response, ApiError> {
    let mut response = (
        StatusCode::OK,
        Json(SessionResponse {
            status: "ok",
            authenticated: false,
            user: None,
        }),
    )
        .into_response();

    response
        .headers_mut()
        .append(header::SET_COOKIE, build_logout_cookie()?);

    Ok(response)
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Response, ApiError> {
    let username = payload.username.trim().to_string();
    let email = payload.email.trim().to_lowercase();

    if username.is_empty() || email.is_empty() || payload.password.len() < 8 {
        return Err(ApiError::Validation(
            "username, email, and a password of at least 8 characters are required".to_string(),
        ));
    }

    if !email.contains('@') {
        return Err(ApiError::Validation(
            "email must be a valid email address".to_string(),
        ));
    }

    let existing_user = user::Entity::find()
        .filter(
            Condition::any()
                .add(user::Column::Email.eq(email.clone()))
                .add(user::Column::Username.eq(username.clone())),
        )
        .one(&state.database)
        .await?;

    if existing_user.is_some() {
        return Err(ApiError::Conflict(
            "a user with that email or username already exists".to_string(),
        ));
    }

    let password_hash = hash_password(&payload.password)?;

    let created_user = user::ActiveModel {
        username: Set(username),
        email: Set(email),
        password_hash: Set(password_hash),
        created_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&state.database)
    .await?;

    let token = issue_jwt(&state, &created_user)?;
    let auth_cookie = build_auth_cookie(&token)?;

    let mut response = (
        StatusCode::CREATED,
        Json(AuthResponse {
            status: "ok",
            message: "registration successful",
            user: AuthUserResponse {
                id: created_user.id,
                username: created_user.username,
                email: created_user.email,
            },
        }),
    )
        .into_response();

    response
        .headers_mut()
        .append(header::SET_COOKIE, auth_cookie);

    Ok(response)
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, ApiError> {
    let email = payload.email.trim().to_lowercase();

    if email.is_empty() || payload.password.is_empty() {
        return Err(ApiError::Validation(
            "email and password are required".to_string(),
        ));
    }

    let user = user::Entity::find()
        .filter(user::Column::Email.eq(email))
        .one(&state.database)
        .await?
        .ok_or(ApiError::Unauthorized)?;

    verify_password(&payload.password, &user.password_hash)?;

    let token = issue_jwt(&state, &user)?;
    let auth_cookie = build_auth_cookie(&token)?;

    let mut response = (
        StatusCode::OK,
        Json(AuthResponse {
            status: "ok",
            message: "login successful",
            user: AuthUserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        }),
    )
        .into_response();

    response
        .headers_mut()
        .append(header::SET_COOKIE, auth_cookie);

    Ok(response)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AuthClaims {
    sub: i32,
    username: String,
    email: String,
    exp: i64,
    iat: i64,
}

fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut OsRng);

    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|value| value.to_string())
        .map_err(|_| ApiError::Internal)
}

    fn verify_password(password: &str, password_hash: &str) -> Result<(), ApiError> {
        let parsed_hash = PasswordHash::new(password_hash).map_err(|_| ApiError::Internal)?;

        Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| ApiError::Unauthorized)
    }

fn issue_jwt(state: &AppState, user: &user::Model) -> Result<String, ApiError> {
    let issued_at = Utc::now();
    let expires_at = issued_at + Duration::hours(24);

    jsonwebtoken::encode(
        &Header::default(),
        &AuthClaims {
            sub: user.id,
            username: user.username.clone(),
            email: user.email.clone(),
            exp: expires_at.timestamp(),
            iat: issued_at.timestamp(),
        },
        &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    )
    .map_err(|_| ApiError::Internal)
}

fn build_auth_cookie(token: &str) -> Result<HeaderValue, ApiError> {
    HeaderValue::from_str(&format!(
        "prompt_lib_token={token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
    ))
    .map_err(|_| ApiError::Internal)
}

fn build_logout_cookie() -> Result<HeaderValue, ApiError> {
    HeaderValue::from_str(
        "prompt_lib_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    )
    .map_err(|_| ApiError::Internal)
}

fn authenticate_request(state: &AppState, headers: &HeaderMap) -> Result<AuthClaims, ApiError> {
    let token = extract_auth_cookie(headers).ok_or(ApiError::Unauthorized)?;

    decode::<AuthClaims>(
        &token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| ApiError::Unauthorized)
}

fn extract_auth_cookie(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::COOKIE)
        .and_then(|cookie| cookie.to_str().ok())
        .and_then(|cookie| {
            cookie.split(';').find_map(|part| {
                let trimmed = part.trim();
                trimmed
                    .strip_prefix("prompt_lib_token=")
                    .map(ToString::to_string)
            })
        })
}