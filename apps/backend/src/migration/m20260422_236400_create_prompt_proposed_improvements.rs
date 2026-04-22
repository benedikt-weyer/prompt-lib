use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TABLE IF NOT EXISTS prompt_proposed_improvements (
                    id SERIAL PRIMARY KEY,
                    prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
                    proposed_improvement_prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
                    CONSTRAINT prompt_proposed_improvements_unique_pair UNIQUE (prompt_id, proposed_improvement_prompt_id),
                    CONSTRAINT prompt_proposed_improvements_no_self_reference CHECK (prompt_id <> proposed_improvement_prompt_id)
                );

                INSERT INTO prompt_proposed_improvements (prompt_id, proposed_improvement_prompt_id)
                SELECT id, proposed_improvement_prompt_id
                FROM prompts
                WHERE proposed_improvement_prompt_id IS NOT NULL
                  AND proposed_improvement_prompt_id <> id
                ON CONFLICT (prompt_id, proposed_improvement_prompt_id) DO NOTHING;

                ALTER TABLE prompts
                    DROP COLUMN IF EXISTS proposed_improvement_prompt_id;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE prompts
                    ADD COLUMN IF NOT EXISTS proposed_improvement_prompt_id INTEGER REFERENCES prompts(id) ON DELETE SET NULL;

                UPDATE prompts
                SET proposed_improvement_prompt_id = source.proposed_improvement_prompt_id
                FROM (
                    SELECT DISTINCT ON (prompt_id)
                        prompt_id,
                        proposed_improvement_prompt_id
                    FROM prompt_proposed_improvements
                    ORDER BY prompt_id, id
                ) AS source
                WHERE prompts.id = source.prompt_id;

                DROP TABLE IF EXISTS prompt_proposed_improvements;
                "#,
            )
            .await?;

        Ok(())
    }
}