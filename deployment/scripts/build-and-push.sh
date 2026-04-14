#!/bin/bash
set -e

SERVICE_NAME="cost-accounting-frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
WEB_DIR="$REPO_ROOT/web"

if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_TOKEN" ]; then
  echo "Error: DOCKERHUB_USERNAME and DOCKERHUB_TOKEN are required" >&2
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

VERSION=$1

if [ -z "$GRAFANA_OBSERVABILITY_FARO_TOKEN" ]; then
  echo "⚠️  GRAFANA_OBSERVABILITY_FARO_TOKEN not set — source maps will NOT be uploaded to Grafana Cloud."
  echo "   Stack traces in Frontend Observability will show minified code."
  echo "   Obtain the token from Grafana Cloud → Access Policies → faro-observability-token."
fi

echo "🚀 Building and pushing $SERVICE_NAME (version: $VERSION)..."
docker buildx build --platform linux/arm64 \
  --build-arg VITE_AUTH_URL=https://api.posadskiy.com/auth \
  --build-arg VITE_USER_URL=https://api.posadskiy.com/user \
  --build-arg VITE_MONEY_ACTIONS_URL=https://api.costy.posadskiy.com/money-actions \
  --build-arg VITE_STATISTICS_URL=https://api.costy.posadskiy.com/statistics \
  --build-arg VITE_PROFILE_SERVICE_URL=https://api.costy.posadskiy.com/profile \
  --build-arg VITE_PROJECT_SERVICE_URL=https://api.costy.posadskiy.com/project \
  --build-arg VITE_BFF_WEB_URL=https://api.costy.posadskiy.com/project \
  --build-arg VITE_FARO_URL=https://faro-collector-prod-eu-west-2.grafana.net/collect/ceb10bda6314a7736ffdcb52b7848c7b \
  --build-arg VITE_APP_VERSION="$VERSION" \
  --build-arg GRAFANA_OBSERVABILITY_FARO_TOKEN="${GRAFANA_OBSERVABILITY_FARO_TOKEN:-}" \
  -f "$WEB_DIR/Dockerfile.prod" \
  -t "$DOCKERHUB_USERNAME/$SERVICE_NAME:$VERSION" \
  -t "$DOCKERHUB_USERNAME/$SERVICE_NAME:latest" \
  "$WEB_DIR" --push

echo "✅ $SERVICE_NAME image built and pushed successfully!"
