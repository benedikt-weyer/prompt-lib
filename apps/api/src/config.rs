use std::env;
use std::net::IpAddr;
use std::net::SocketAddr;

use anyhow::{Context, Result};

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub api_host: IpAddr,
    pub api_port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub frontend_origin: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let api_host = env::var("API_HOST")
            .ok()
            .map(|value| value.parse::<IpAddr>().context("parse API_HOST"))
            .transpose()?
            .unwrap_or(IpAddr::from([127, 0, 0, 1]));

        let api_port = env::var("API_PORT")
            .ok()
            .map(|value| value.parse::<u16>().context("parse API_PORT"))
            .transpose()?
            .unwrap_or(4000);

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/prompt_lib".to_string());
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "replace-me".to_string());
        let frontend_origin = env::var("FRONTEND_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());

        Ok(Self {
            api_host,
            api_port,
            database_url,
            jwt_secret,
            frontend_origin,
        })
    }

    pub fn bind_address(&self) -> SocketAddr {
        SocketAddr::from((self.api_host, self.api_port))
    }
}