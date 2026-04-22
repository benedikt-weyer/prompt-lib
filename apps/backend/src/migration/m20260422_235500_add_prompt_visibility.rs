use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Prompts::Table)
                    .add_column(
                        ColumnDef::new(Prompts::IsPublic)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Prompts::Table)
                    .drop_column(Prompts::IsPublic)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Prompts {
    #[sea_orm(iden = "prompts")]
    Table,
    IsPublic,
}