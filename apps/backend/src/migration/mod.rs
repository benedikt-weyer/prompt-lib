pub use sea_orm_migration::prelude::*;

mod m20260422_143423_init_prompt_lib_schema;
mod m20260422_201000_add_review_comments;
mod m20260422_235500_add_prompt_visibility;
mod m20260422_235900_decouple_models_from_frameworks;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(
            m20260422_143423_init_prompt_lib_schema::Migration,
        ), Box::new(
            m20260422_201000_add_review_comments::Migration,
        ), Box::new(
            m20260422_235500_add_prompt_visibility::Migration,
        ), Box::new(
            m20260422_235900_decouple_models_from_frameworks::Migration,
        )]
    }
}