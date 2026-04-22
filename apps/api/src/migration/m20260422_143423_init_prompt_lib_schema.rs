use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        db.execute_unprepared(
            r#"
            CREATE TYPE thinking_effort AS ENUM ('low', 'medium', 'high');

            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(64) NOT NULL UNIQUE,
                email VARCHAR(320) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE categories (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(120) NOT NULL,
                slug VARCHAR(140) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE prompts (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL UNIQUE,
                prompt TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE llm_frameworks (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE llm_models (
                id SERIAL PRIMARY KEY,
                creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                framework_id INTEGER NOT NULL REFERENCES llm_frameworks(id) ON DELETE RESTRICT,
                name VARCHAR(160) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                thinking_effort thinking_effort NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (framework_id, slug)
            );

            CREATE TABLE reviews (
                id SERIAL PRIMARY KEY,
                prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
                reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                llm_model_id INTEGER NOT NULL REFERENCES llm_models(id) ON DELETE RESTRICT,
                stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 10),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        db.execute_unprepared(
            r#"
            DROP TABLE reviews;
            DROP TABLE llm_models;
            DROP TABLE llm_frameworks;
            DROP TABLE prompts;
            DROP TABLE categories;
            DROP TABLE users;
            DROP TYPE thinking_effort;
            "#,
        )
        .await?;

        Ok(())
    }
}