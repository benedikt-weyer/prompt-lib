use sea_orm::{ConnectionTrait, DatabaseBackend, DatabaseConnection, Statement};

pub async fn ensure_database(database: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thinking_effort') THEN
                    CREATE TYPE thinking_effort AS ENUM ('low', 'medium', 'high');
                END IF;
            END
            $$;
            "#,
        ))
        .await?;

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

    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            CREATE TABLE IF NOT EXISTS llm_frameworks (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL UNIQUE,
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
            CREATE TABLE IF NOT EXISTS llm_models (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                framework_id INTEGER NOT NULL REFERENCES llm_frameworks(id) ON DELETE RESTRICT,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                thinking_effort thinking_effort NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (framework_id, slug)
            );
            "#,
        ))
        .await?;

    database
        .execute(Statement::from_string(
            DatabaseBackend::Postgres,
            r#"
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
                reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                llm_model_id INTEGER NOT NULL REFERENCES llm_models(id) ON DELETE RESTRICT,
                stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 10),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            "#,
        ))
        .await?;

    Ok(())
}