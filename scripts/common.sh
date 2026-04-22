#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RUN_DIR="$REPO_ROOT/.run"
LOG_DIR="$REPO_ROOT/.logs"
ENV_TEMPLATE_FILE="${PROMPT_LIB_ENV_TEMPLATE:-$REPO_ROOT/.env.example}"
ENV_FILE="${PROMPT_LIB_ENV_FILE:-$REPO_ROOT/.env}"

load_env() {
  local env_file

  env_file="$ENV_FILE"

  if [[ ! -f "$env_file" ]]; then
    env_file="$ENV_TEMPLATE_FILE"
  fi

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a

  export POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
  export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  export POSTGRES_DB="${POSTGRES_DB:-prompt_lib}"
  export POSTGRES_USER="${POSTGRES_USER:-postgres}"
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
  export API_PORT="${API_PORT:-4000}"
  export FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:3000}"
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:4000}"
  export JWT_SECRET="${JWT_SECRET:-replace-me}"
  export DATABASE_URL="${DATABASE_URL:-postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}}"
}

ensure_dirs() {
  mkdir -p "$RUN_DIR" "$LOG_DIR"
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

require_cargo_watch() {
  if ! cargo watch --version >/dev/null 2>&1; then
    cat >&2 <<'EOF'
Missing cargo-watch.

Install it with:
  cargo install cargo-watch
EOF
    exit 1
  fi
}

is_pid_running() {
  local pid="$1"

  kill -0 "$pid" >/dev/null 2>&1
}

stop_pid_file() {
  local pid_file="$1"
  local name="$2"

  if [[ ! -f "$pid_file" ]]; then
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -n "$pid" ]] && is_pid_running "$pid"; then
    echo "Stopping $name ($pid)..."
    kill "$pid" >/dev/null 2>&1 || true

    for _ in {1..20}; do
      if ! is_pid_running "$pid"; then
        break
      fi
      sleep 0.5
    done

    if is_pid_running "$pid"; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  fi

  rm -f "$pid_file"
}

start_background() {
  local name="$1"
  local pid_file="$2"
  local log_file="$3"
  shift 3

  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if [[ -n "$existing_pid" ]] && is_pid_running "$existing_pid"; then
      echo "$name is already running ($existing_pid)."
      return 0
    fi
    rm -f "$pid_file"
  fi

  echo "Starting $name..."
  (
    cd "$REPO_ROOT"
    nohup "$@" >"$log_file" 2>&1 &
    echo $! >"$pid_file"
  )
}

wait_for_postgres() {
  local attempts=30

  echo "Waiting for PostgreSQL to become healthy..."

  for _ in $(seq 1 "$attempts"); do
    if docker compose -f "$REPO_ROOT/compose.yaml" exec -T db \
      pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      echo "PostgreSQL is ready."
      return 0
    fi
    sleep 1
  done

  echo "PostgreSQL did not become ready in time." >&2
  return 1
}