FROM rust:1.88-bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY apps/api ./apps/api
RUN cargo build --manifest-path apps/api/Cargo.toml --release --bin prompt-lib-api

FROM debian:bookworm-slim AS runner
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV API_HOST=0.0.0.0
ENV API_PORT=4000
COPY --from=builder /app/target/release/prompt-lib-api /usr/local/bin/prompt-lib-api
EXPOSE 4000
CMD ["prompt-lib-api"]