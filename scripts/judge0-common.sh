#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/judge0"
PROFILE="${JUDGE0_COLIMA_PROFILE:-judge0-x64}"
PORT="${JUDGE0_HOST_PORT:-2358}"
JUDGE0_URL="http://127.0.0.1:$PORT"
RUNTIME_PROBE_BOX_ID="${JUDGE0_RUNTIME_PROBE_BOX_ID:-2147483000}"

host_os() {
  uname -s
}

host_arch() {
  uname -m
}

is_linux_x64_host() {
  [[ "$(host_os)" == "Linux" && ("$(host_arch)" == "x86_64" || "$(host_arch)" == "amd64") ]]
}

is_macos_arm64_host() {
  [[ "$(host_os)" == "Darwin" && "$(host_arch)" == "arm64" ]]
}

colima_profile_field() {
  local field_index="$1"
  local list_output
  list_output="$(colima list 2>/dev/null || true)"
  printf '%s\n' "$list_output" | awk -v profile="$PROFILE" -v field="$field_index" '$1 == profile { print $field; exit }'
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ensure_compose_runtime_available() {
  if is_linux_x64_host; then
    require_command docker
    return
  fi

  if is_macos_arm64_host; then
    require_command colima
    return
  fi

  echo "Unsupported host for these Judge0 helpers: $(host_os) $(host_arch). Use a Linux x86_64 VM for full sandboxing." >&2
  exit 1
}

ensure_colima_profile_running() {
  local list_output
  list_output="$(colima list 2>/dev/null || true)"
  if ! printf '%s\n' "$list_output" | awk -v profile="$PROFILE" '$1 == profile && $2 == "Running" { found = 1 } END { exit found ? 0 : 1 }'; then
    echo "Colima profile '$PROFILE' is not running." >&2
    exit 1
  fi
}

run_in_compose_runtime() {
  if is_linux_x64_host; then
    (
      cd "$COMPOSE_DIR"
      "$@"
    )
    return
  fi

  ensure_colima_profile_running

  local remote_cmd
  printf -v remote_cmd '%q ' sudo "$@"
  colima ssh --profile "$PROFILE" -- bash -lc "cd '$COMPOSE_DIR' && $remote_cmd"
}

compose_cmd() {
  run_in_compose_runtime docker compose "$@"
}

container_id_for_service() {
  compose_cmd ps -q "$1" | tr -d '\r'
}

api_is_reachable() {
  curl -fsS "$JUDGE0_URL/languages" >/dev/null 2>&1
}

guest_cgroup_mode() {
  if is_linux_x64_host; then
    if [[ -f /sys/fs/cgroup/cgroup.controllers ]]; then
      echo "cgroup-v2"
    else
      echo "cgroup-v1"
    fi
    return
  fi

  if is_macos_arm64_host; then
    ensure_colima_profile_running
    colima ssh --profile "$PROFILE" -- bash -lc 'if [[ -f /sys/fs/cgroup/cgroup.controllers ]]; then echo cgroup-v2; else echo cgroup-v1; fi'
    return
  fi

  echo "unknown"
}

guest_arch() {
  if is_linux_x64_host; then
    uname -m
    return
  fi

  if is_macos_arm64_host; then
    local arch
    arch="$(colima_profile_field 3)"
    if [[ -n "$arch" ]]; then
      echo "$arch"
      return
    fi

    ensure_colima_profile_running
    colima ssh --profile "$PROFILE" -- uname -m
    return
  fi

  echo "unknown"
}

runtime_probe() {
  local server_container
  server_container="$(container_id_for_service server)"

  if [[ -z "$server_container" ]]; then
    echo "Judge0 server container is not running." >&2
    return 1
  fi

  local probe_script
  read -r -d '' probe_script <<'EOF' || true
box_id="${RUNTIME_PROBE_BOX_ID:?}"
probe_err="/tmp/judge0-runtime-probe.err"
isolate --cg -b "$box_id" --cleanup >/dev/null 2>&1 || true
workdir="$(isolate --cg -b "$box_id" --init 2>"$probe_err" || true)"

cleanup() {
  isolate --cg -b "$box_id" --cleanup >/dev/null 2>&1 || true
  rm -f "$probe_err"
}

trap cleanup EXIT

if [[ -n "${workdir:-}" && -d "$workdir" && -d "$workdir/box" ]]; then
  printf 'RUNTIME_PROBE=ok\n'
  printf 'WORKDIR=%s\n' "$workdir"
  exit 0
fi

printf 'RUNTIME_PROBE=failed\n'
if [[ -z "${workdir:-}" ]]; then
  printf 'ERROR=isolate --cg --init did not return a workdir\n'
fi
if [[ -s "$probe_err" ]]; then
  printf 'ERROR=%s\n' "$(tr '\n' ' ' < "$probe_err" | sed 's/[[:space:]]\\+/ /g; s/[[:space:]]$//')"
fi
exit 1
EOF

  if is_linux_x64_host; then
    docker exec -e "RUNTIME_PROBE_BOX_ID=$RUNTIME_PROBE_BOX_ID" "$server_container" bash -lc "$probe_script"
    return
  fi

  ensure_colima_profile_running

  local remote_cmd probe_output probe_exit
  printf -v remote_cmd '%q ' sudo docker exec -e "RUNTIME_PROBE_BOX_ID=$RUNTIME_PROBE_BOX_ID" "$server_container" bash -lc "$probe_script"
  probe_output="$(colima ssh --profile "$PROFILE" -- bash -lc "cd '$COMPOSE_DIR' && { $remote_cmd; printf '__RUNTIME_PROBE_EXIT__=%s\n' \$?; exit 0; }")"
  probe_exit="$(printf '%s\n' "$probe_output" | awk -F= '/^__RUNTIME_PROBE_EXIT__=/{print $2}' | tail -n 1)"
  printf '%s\n' "$probe_output" | sed '/^__RUNTIME_PROBE_EXIT__=/d'

  [[ "$probe_exit" == "0" ]]
}

wait_for_api() {
  local attempts="${1:-45}"

  for ((i = 1; i <= attempts; i += 1)); do
    if api_is_reachable; then
      return 0
    fi
    sleep 2
  done

  return 1
}

full_sandbox_supported_on_host() {
  if is_linux_x64_host; then
    return 0
  fi

  if is_macos_arm64_host; then
    [[ "$(guest_arch)" == "x86_64" && "$(guest_cgroup_mode)" == "cgroup-v1" ]]
    return
  fi

  return 1
}
