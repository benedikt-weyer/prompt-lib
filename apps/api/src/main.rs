mod config;
mod entities;
mod error;
mod models;
mod routes;
mod state;

use anyhow::Context;
use sea_orm::Database;
use tokio::net::TcpListener;
use tracing::info;

use crate::config::AppConfig;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();

    let config = AppConfig::from_env().context("load configuration")?;
    let database = Database::connect(&config.database_url)
        .await
        .context("connect to PostgreSQL")?;

    let bind_address = config.bind_address();
    let state = AppState::new(config, database);
    let app = routes::app_router(state);
    let listener = TcpListener::bind(bind_address)
        .await
        .context("bind API listener")?;

    info!("prompt-lib-api listening on http://{bind_address}");
    axum::serve(listener, app).await.context("run API server")?;

    Ok(())
}

fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "prompt_lib_api=debug,tower_http=debug,info".into()),
        )
        .compact()
        .init();
}
