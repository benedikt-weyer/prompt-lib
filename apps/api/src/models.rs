use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct FeatureStatusResponse {
    pub status: &'static str,
    pub message: &'static str,
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
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub prompt_count: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PromptResponse {
    pub id: i32,
    pub name: String,
    pub slug: String,
    pub prompt: String,
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
pub struct CreatePromptRequest {
    pub category_id: i32,
    pub name: String,
    pub prompt: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub stars: i16,
    pub llm_model_name: String,
    pub thinking_effort: ThinkingEffortDto,
    pub llm_framework: String,
}