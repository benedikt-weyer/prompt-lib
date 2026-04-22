use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "reviews")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub prompt_id: i32,
    pub reviewer_id: i32,
    pub llm_model_id: i32,
    pub stars: i16,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::prompt::Entity",
        from = "Column::PromptId",
        to = "super::prompt::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Prompt,
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::ReviewerId",
        to = "super::user::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Reviewer,
    #[sea_orm(
        belongs_to = "super::llm_model::Entity",
        from = "Column::LlmModelId",
        to = "super::llm_model::Column::Id",
        on_update = "Cascade",
        on_delete = "Restrict"
    )]
    LlmModel,
}

impl Related<super::prompt::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Prompt.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Reviewer.def()
    }
}

impl Related<super::llm_model::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmModel.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}