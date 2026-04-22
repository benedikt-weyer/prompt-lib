use axum::extract::State;
use axum::Json;
use sea_orm::ConnectionTrait;

use crate::models::HealthResponse;
use crate::state::AppState;

pub async fn root(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        service: "prompt-lib-backend",
        database: format!("{:?}", state.database.get_database_backend()),
    })
}

pub async fn get_health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        service: "prompt-lib-backend",
        database: format!("{:?}", state.database.get_database_backend()),
    })
}