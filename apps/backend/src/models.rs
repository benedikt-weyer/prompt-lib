use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PromptExecutionType {
    Agent,
    Plan,
    Ask,
    #[default]
    Unknown,
}

impl PromptExecutionType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Agent => "agent",
            Self::Plan => "plan",
            Self::Ask => "ask",
            Self::Unknown => "unknown",
        }
    }

    pub fn from_db(value: &str) -> Self {
        match value {
            "agent" => Self::Agent,
            "plan" => Self::Plan,
            "ask" => Self::Ask,
            _ => Self::Unknown,
        }
    }
}

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
    pub parent_category_id: Option<i32>,
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
pub struct LlmModelSummaryResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct LlmModelThinkingEffortResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub is_default: bool,
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
    pub creator_id: i32,
    pub name: String,
    pub slug: String,
    pub thinking_efforts: Vec<LlmModelThinkingEffortResponse>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReviewResponse {
    pub id: i32,
    pub reviewer_id: i32,
    pub stars: i16,
    pub comment: Option<String>,
    pub reviewer_name: String,
    pub llm_model: LlmModelSummaryResponse,
    pub llm_framework: LlmFrameworkSummaryResponse,
    pub thinking_effort: LlmModelThinkingEffortResponse,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PromptFollowUpResponse {
    pub id: i32,
    pub position: i32,
    pub body: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PromptResponse {
    pub id: i32,
    pub creator_id: i32,
    pub name: String,
    pub slug: String,
    pub prompt: String,
    pub follow_up_prompts: Vec<PromptFollowUpResponse>,
    pub execution_type: PromptExecutionType,
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
    pub parent_category_id: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLlmFrameworkRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLlmModelRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLlmModelRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLlmModelThinkingEffortRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePromptRequest {
    pub category_id: i32,
    pub name: String,
    pub prompt: String,
    #[serde(default)]
    pub follow_up_prompts: Vec<String>,
    #[serde(default)]
    pub execution_type: PromptExecutionType,
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
    #[serde(default)]
    pub follow_up_prompts: Vec<String>,
    #[serde(default)]
    pub execution_type: PromptExecutionType,
    pub is_public: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub stars: i16,
    pub comment: Option<String>,
    pub llm_model_id: i32,
    pub llm_framework_id: i32,
    pub llm_model_thinking_effort_id: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReviewRequest {
    pub stars: i16,
    pub comment: Option<String>,
    pub llm_model_id: i32,
    pub llm_framework_id: i32,
    pub llm_model_thinking_effort_id: i32,
}