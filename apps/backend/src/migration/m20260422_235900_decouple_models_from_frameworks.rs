use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        db.execute_unprepared(
            r#"
            ALTER TABLE llm_models
                ALTER COLUMN framework_id DROP NOT NULL,
                ALTER COLUMN thinking_effort DROP NOT NULL;

            ALTER TABLE llm_models
                DROP CONSTRAINT IF EXISTS llm_models_framework_id_slug_key;

            ALTER TABLE llm_models
                ADD CONSTRAINT llm_models_slug_key UNIQUE (slug);

            CREATE TABLE llm_model_thinking_efforts (
                id SERIAL PRIMARY KEY,
                llm_model_id INTEGER NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
                name VARCHAR(80) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (llm_model_id, slug)
            );

            INSERT INTO llm_model_thinking_efforts (llm_model_id, name, slug, is_default, created_at)
            SELECT id, 'unknown', 'unknown', TRUE, NOW()
            FROM llm_models
            ON CONFLICT (llm_model_id, slug) DO NOTHING;

            INSERT INTO llm_model_thinking_efforts (llm_model_id, name, slug, is_default, created_at)
            SELECT id, 'none', 'none', TRUE, NOW()
            FROM llm_models
            ON CONFLICT (llm_model_id, slug) DO NOTHING;

            INSERT INTO llm_model_thinking_efforts (llm_model_id, name, slug, is_default, created_at)
            SELECT id, CAST(thinking_effort AS TEXT), CAST(thinking_effort AS TEXT), FALSE, NOW()
            FROM llm_models
            WHERE thinking_effort IS NOT NULL
            ON CONFLICT (llm_model_id, slug) DO NOTHING;

            ALTER TABLE reviews
                ADD COLUMN llm_framework_id INTEGER REFERENCES llm_frameworks(id) ON DELETE RESTRICT,
                ADD COLUMN llm_model_thinking_effort_id INTEGER REFERENCES llm_model_thinking_efforts(id) ON DELETE RESTRICT;

            UPDATE reviews AS reviews
            SET llm_framework_id = llm_models.framework_id
            FROM llm_models
            WHERE reviews.llm_model_id = llm_models.id;

            UPDATE reviews AS reviews
            SET llm_model_thinking_effort_id = efforts.id
            FROM llm_models
            JOIN llm_model_thinking_efforts AS efforts
                ON efforts.llm_model_id = llm_models.id
               AND efforts.slug = CAST(llm_models.thinking_effort AS TEXT)
            WHERE reviews.llm_model_id = llm_models.id;

            ALTER TABLE reviews
                ALTER COLUMN llm_framework_id SET NOT NULL,
                ALTER COLUMN llm_model_thinking_effort_id SET NOT NULL;
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        db.execute_unprepared(
            r#"
            ALTER TABLE reviews
                DROP COLUMN IF EXISTS llm_model_thinking_effort_id,
                DROP COLUMN IF EXISTS llm_framework_id;

            DROP TABLE IF EXISTS llm_model_thinking_efforts;

            ALTER TABLE llm_models
                DROP CONSTRAINT IF EXISTS llm_models_slug_key;

            ALTER TABLE llm_models
                ADD CONSTRAINT llm_models_framework_id_slug_key UNIQUE (framework_id, slug);

            ALTER TABLE llm_models
                ALTER COLUMN framework_id SET NOT NULL,
                ALTER COLUMN thinking_effort SET NOT NULL;
            "#,
        )
        .await?;

        Ok(())
    }
}