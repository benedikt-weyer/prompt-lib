use sea_orm::{ConnectionTrait, DatabaseBackend, DatabaseConnection, Statement};

pub async fn ensure_database(database: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(64) NOT NULL UNIQUE,
                email VARCHAR(320) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            "#,
        ))
        .await?;

    Ok(())
}