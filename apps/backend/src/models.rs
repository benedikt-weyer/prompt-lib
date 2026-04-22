use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct AuthUserResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AuthResponse {
    pub status: &'static str,
    pub message: &'static str,
    pub user: AuthUserResponse,
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionResponse {
    pub status: &'static str,
    pub authenticated: bool,
    pub user: Option<AuthUserResponse>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub prompt_count: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct LlmFrameworkSummaryResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct LlmFrameworkResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub model_count: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct LlmModelResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub thinking_effort: ThinkingEffortDto,
    pub framework: LlmFrameworkSummaryResponse,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReviewResponse {
    pub id: i32,
    pub stars: i16,
    pub reviewer_name: String,
    pub llm_model: LlmModelResponse,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PromptResponse {
    pub id: i32,
    pub creator_id: i32,
    pub name: String,
    pub slug: String,
    pub prompt: String,
    pub is_public: bool,
    pub author_name: String,
    pub category: CategoryResponse,
    pub review_count: u64,
    pub average_stars: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub service: &'static str,
    pub database: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ThinkingEffortDto {
    Low,
    Medium,
    High,
}

impl From<crate::entities::thinking_effort::ThinkingEffort> for ThinkingEffortDto {
    fn from(value: crate::entities::thinking_effort::ThinkingEffort) -> Self {
        match value {
            crate::entities::thinking_effort::ThinkingEffort::Low => Self::Low,
            crate::entities::thinking_effort::ThinkingEffort::Medium => Self::Medium,
            crate::entities::thinking_effort::ThinkingEffort::High => Self::High,
        }
    }
}

impl From<ThinkingEffortDto> for crate::entities::thinking_effort::ThinkingEffort {
    fn from(value: ThinkingEffortDto) -> Self {
        match value {
            ThinkingEffortDto::Low => Self::Low,
            ThinkingEffortDto::Medium => Self::Medium,
            ThinkingEffortDto::High => Self::High,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLlmFrameworkRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLlmModelRequest {
    pub framework_id: i32,
    pub name: String,
    pub thinking_effort: ThinkingEffortDto,
}

#[derive(Debug, Deserialize)]
pub struct ListLlmModelsQuery {
    pub framework_id: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePromptRequest {
    pub category_id: i32,
    pub name: String,
    pub prompt: String,
    #[serde(default)]
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePromptVisibilityRequest {
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePromptRequest {
    pub category_id: i32,
    pub name: String,
    pub prompt: String,
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub stars: i16,
    pub llm_model_id: i32,
}