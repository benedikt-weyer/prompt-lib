use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::category::Entity")]
    Categories,
    #[sea_orm(has_many = "super::prompt::Entity")]
    Prompts,
    #[sea_orm(has_many = "super::review::Entity")]
    Reviews,
}

impl ActiveModelBehavior for ActiveModel {}