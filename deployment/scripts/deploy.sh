#!/bin/bash
set -e

SERVICE_NAME="cost-accounting-frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SERVICE_MANIFEST="$REPO_ROOT/deployment/$SERVICE_NAME.yaml"
INGRESS_MANIFEST="$REPO_ROOT/deployment/$SERVICE_NAME-ingressroute.yaml"
NAMESPACE="${K8S_NAMESPACE:-costy}"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

VERSION=$1

echo "🚀 Deploying $SERVICE_NAME"
echo "📦 Version: $VERSION"
echo "📁 Namespace: $NAMESPACE"
echo ""

if ! kubectl cluster-info &>/dev/null; then
  echo "❌ Error: Cannot connect to cluster" >&2
  exit 1
fi
echo "✅ Connected to cluster"

if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "❌ Error: Namespace $NAMESPACE does not exist." >&2
  exit 1
fi
echo "✅ Namespace $NAMESPACE exists"
echo ""

if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "❌ Error: DOCKERHUB_USERNAME is required" >&2
  exit 1
fi
export DOCKERHUB_USERNAME

if ! command -v envsubst &>/dev/null; then
  echo "❌ Error: envsubst is required" >&2
  exit 1
fi

export IMAGE_VERSION=$VERSION
echo "🚀 Applying manifest..."
envsubst < "$SERVICE_MANIFEST" | kubectl apply -f -

if [ -f "$INGRESS_MANIFEST" ]; then
  echo "🌐 Applying ingress route..."
  kubectl apply -f "$INGRESS_MANIFEST"
fi

echo ""
echo "⏳ Waiting for deployment..."
kubectl wait --for=condition=available --timeout=300s "deployment/$SERVICE_NAME" -n "$NAMESPACE" || true

echo ""
echo "✅ $SERVICE_NAME deployment completed!"
kubectl get pods -n "$NAMESPACE" -l app=$SERVICE_NAME
