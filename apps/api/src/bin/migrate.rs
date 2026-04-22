#[path = "../migration/mod.rs"]
mod migration;

use sea_orm_migration::cli;

#[tokio::main]
async fn main() {
    cli::run_cli(migration::Migrator).await;
}