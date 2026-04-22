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
                CREATE TABLE IF NOT EXISTS prompt_follow_ups (
                    id SERIAL PRIMARY KEY,
                    prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL CHECK (position > 0),
                    body TEXT NOT NULL,
                    UNIQUE (prompt_id, position)
                );

                CREATE INDEX IF NOT EXISTS idx_prompt_follow_ups_prompt_id_position
                    ON prompt_follow_ups (prompt_id, position);
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
                DROP TABLE IF EXISTS prompt_follow_ups;
                "#,
            )
            .await?;

        Ok(())
    }
}