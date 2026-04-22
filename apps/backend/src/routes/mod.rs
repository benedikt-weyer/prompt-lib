pub mod auth;
pub mod categories;
pub mod health;
pub mod llm_frameworks;
pub mod llm_models;
pub mod prompts;
pub mod reviews;

use axum::http::{header, HeaderValue, Method};
use axum::routing::get;
use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::state::AppState;

pub fn app_router(state: AppState) -> Router {
    let origin = state
        .config
        .frontend_origin
        .parse::<HeaderValue>()
        .expect("FRONTEND_ORIGIN must be a valid header value");

    Router::new()
        .route("/", get(health::root))
        .nest("/api", api_router())
        .layer(
            CorsLayer::new()
                .allow_origin(origin)
                .allow_credentials(true)
                .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::PATCH,
                    Method::DELETE,
                ]),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

fn api_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::get_health))
        .nest("/auth", auth::router())
        .nest("/categories", categories::router())
        .nest("/llm-frameworks", llm_frameworks::router())
        .nest("/llm-models", llm_models::router())
        .nest("/prompts", prompts::router())
}