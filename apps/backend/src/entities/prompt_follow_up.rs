use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "prompt_follow_ups")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub prompt_id: i32,
    pub position: i32,
    pub body: String,
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
}

impl Related<super::prompt::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Prompt.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}