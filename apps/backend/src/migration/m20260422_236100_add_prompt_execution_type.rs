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
                ALTER TABLE prompts
                    ADD COLUMN IF NOT EXISTS execution_type VARCHAR(16) NOT NULL DEFAULT 'unknown';

                ALTER TABLE prompts
                    DROP CONSTRAINT IF EXISTS prompts_execution_type_check;

                ALTER TABLE prompts
                    ADD CONSTRAINT prompts_execution_type_check
                    CHECK (execution_type IN ('agent', 'plan', 'ask', 'unknown'));
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
                    DROP CONSTRAINT IF EXISTS prompts_execution_type_check;

                ALTER TABLE prompts
                    DROP COLUMN IF EXISTS execution_type;
                "#,
            )
            .await?;

        Ok(())
    }
}