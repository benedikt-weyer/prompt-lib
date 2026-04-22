use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "llm_model_thinking_efforts")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub llm_model_id: i32,
    pub name: String,
    pub slug: String,
    pub is_default: bool,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::llm_model::Entity",
        from = "Column::LlmModelId",
        to = "super::llm_model::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    LlmModel,
}

impl Related<super::llm_model::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::LlmModel.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}