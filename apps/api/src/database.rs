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

    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(120) NOT NULL,
                slug VARCHAR(140) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            "#,
        ))
        .await?;

    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            CREATE TABLE IF NOT EXISTS prompts (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL UNIQUE,
                prompt TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            "#,
        ))
        .await?;

    Ok(())
}