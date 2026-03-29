#!/bin/bash

###############################################################################
# Grocery App - Cleanup & Delete All Resources
#
# This script safely deletes all Kubernetes resources to allow fresh deployment
#
# Usage: ./cleanup.sh
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NAMESPACE="grocery-app"

info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

###############################################################################
# Main
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Grocery App - Cleanup Script (DELETE ALL RESOURCES)    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verify kubectl is available
if ! command -v kubectl &> /dev/null; then
  error "kubectl not found. Please install kubectl."
fi

# Verify cluster connectivity
info "Verifying cluster connection..."
if ! kubectl cluster-info &> /dev/null; then
  error "Cannot connect to Kubernetes cluster. Check kubeconfig."
fi
success "Connected to cluster"

echo ""
echo "⚠️  WARNING: This will delete ALL resources in the '$NAMESPACE' namespace!"
echo ""

# Confirm deletion
read -p "Are you sure you want to DELETE everything? Type 'YES' to confirm: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "Cancelled. Nothing was deleted."
  exit 0
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Step 1: Delete Application Resources                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Delete application resources
info "Deleting deployments..."
kubectl delete deployment -n $NAMESPACE --all --ignore-not-found=true
success "Deployments deleted"

info "Deleting services..."
kubectl delete service -n $NAMESPACE --all --ignore-not-found=true
success "Services deleted"

info "Deleting configmaps..."
kubectl delete configmap -n $NAMESPACE --all --ignore-not-found=true
success "ConfigMaps deleted"

info "Deleting HPA..."
kubectl delete hpa -n $NAMESPACE --all --ignore-not-found=true
success "HPA deleted"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Step 2: Delete External Secrets Resources                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

info "Deleting ExternalSecrets..."
kubectl delete externalsecrets -n $NAMESPACE --all --ignore-not-found=true
success "ExternalSecrets deleted"

info "Deleting SecretStore..."
kubectl delete secretstore -n $NAMESPACE --all --ignore-not-found=true
success "SecretStore deleted"

info "Deleting ServiceAccount..."
kubectl delete serviceaccount -n $NAMESPACE --all --ignore-not-found=true
success "ServiceAccount deleted"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Step 3: Delete Kubernetes Secrets                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

info "Deleting all secrets..."
kubectl delete secret -n $NAMESPACE --all --ignore-not-found=true
success "Secrets deleted"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Step 4: Delete Namespace (optional)                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

read -p "Delete the '$NAMESPACE' namespace? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  info "Deleting namespace '$NAMESPACE'..."
  kubectl delete namespace $NAMESPACE --ignore-not-found=true
  
  # Wait for namespace to be deleted
  echo -n "Waiting for namespace deletion..."
  for i in {1..30}; do
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
      echo ""
      success "Namespace deleted"
      break
    fi
    echo -n "."
    sleep 1
  done
else
  info "Skipping namespace deletion"
  success "Namespace '$NAMESPACE' still exists (useful for redeployment)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Cleanup Complete!                                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✓ All resources deleted successfully"
echo ""
echo "Next steps to redeploy:"
echo ""
echo "1. Deploy External Secrets Operator:"
echo "   kubectl apply -f 00a-crds.yaml"
echo "   kubectl apply -f 00-external-secrets-operator.yaml"
echo "   kubectl apply -f 01-namespace.yaml"
echo ""
echo "2. Wait for operator:"
echo "   kubectl rollout status deployment/external-secrets-operator -n external-secrets --timeout=5m"
echo ""
echo "3. Deploy ServiceAccount and Secrets:"
echo "   kubectl apply -f 02a-serviceaccount.yaml"
echo "   kubectl apply -f 02-secrets.yaml"
echo ""
echo "4. Deploy application:"
echo "   kubectl apply -f 03-configmap.yaml"
echo "   kubectl apply -f 04-backend-deployment.yaml"
echo "   kubectl apply -f 05-frontend-deployment.yaml"
echo "   kubectl apply -f 06-backend-service.yaml"
echo "   kubectl apply -f 07-frontend-service.yaml"
echo "   kubectl apply -f 09-hpa.yaml"
echo ""
echo "Or use the deploy script:"
echo "   ./deploy.sh"
echo ""
