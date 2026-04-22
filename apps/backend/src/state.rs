use sea_orm::DatabaseConnection;

use crate::config::AppConfig;

#[derive(Clone)]
pub struct AppState {
    pub config: AppConfig,
    pub database: DatabaseConnection,
}

impl AppState {
    pub fn new(config: AppConfig, database: DatabaseConnection) -> Self {
        Self { config, database }
    }
}