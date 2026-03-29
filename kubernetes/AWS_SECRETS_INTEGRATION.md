# AWS Secrets Manager Integration Guide

This guide explains how to integrate AWS Secrets Manager with your EKS cluster using External Secrets Operator.

## Architecture

```
AWS Secrets Manager
├── grocery-app/docker-hub-auth
├── grocery-app/db-host
├── grocery-app/db-user
├── grocery-app/db-password
├── grocery-app/db-name
└── grocery-app/jwt-secret

        ↓ (External Secrets Operator watches)

Kubernetes Secret Store
├── docker-hub-credentials
├── grocery-db-credentials
└── app-secrets

        ↓ (Pods read)

Your Application
```

## Step 1: Create Secrets in AWS Secrets Manager

### Store Docker Hub Credentials

```bash
# Create base64 encoded auth
DOCKER_AUTH=$(echo -n "YOUR_DOCKER_HUB_USERNAME:YOUR_DOCKER_HUB_PASSWORD" | base64)

aws secretsmanager create-secret \
  --name grocery-app/docker-hub-auth \
  --secret-string "$DOCKER_AUTH" \
  --region us-east-1
```

### Store Database Credentials

```bash
# RDS Host
aws secretsmanager create-secret \
  --name grocery-app/db-host \
  --secret-string "your-rds-endpoint.us-east-1.rds.amazonaws.com" \
  --region us-east-1

# DB User
aws secretsmanager create-secret \
  --name grocery-app/db-user \
  --secret-string "admin" \
  --region us-east-1

# DB Password
aws secretsmanager create-secret \
  --name grocery-app/db-password \
  --secret-string "your-secure-password" \
  --region us-east-1

# DB Name
aws secretsmanager create-secret \
  --name grocery-app/db-name \
  --secret-string "grocery_db" \
  --region us-east-1
```

### Store JWT Secret

```bash
aws secretsmanager create-secret \
  --name grocery-app/jwt-secret \
  --secret-string "your-secure-jwt-secret-key" \
  --region us-east-1
```

### Verify Secrets

```bash
aws secretsmanager list-secrets --filters Key=name,Values=grocery-app --region us-east-1
```

## Step 2: Create IAM Role for External Secrets

### Create Trust Policy

Save as `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/YOUR_OIDC_ID:sub": "system:serviceaccount:grocery-app:external-secrets-sa"
        }
      }
    }
  ]
}
```

### Get Your OIDC Provider Info

```bash
# Get OIDC provider URL
OIDC_ID=$(aws eks describe-cluster --name grocery-app-cluster --query "cluster.identity.oidc.issuer" --output text | cut -d '/' -f 5)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

echo "OIDC ID: $OIDC_ID"
echo "Account ID: $AWS_ACCOUNT_ID"

# Update trust-policy.json with your actual values
sed -i "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" trust-policy.json
sed -i "s/YOUR_OIDC_ID/$OIDC_ID/g" trust-policy.json
```

### Create IAM Role

```bash
# Create role
aws iam create-role \
  --role-name grocery-app-external-secrets-role \
  --assume-role-policy-document file://trust-policy.json \
  --region us-east-1

# Create policy for Secrets Manager access
cat > secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:ListSecrets"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:grocery-app/*"
    }
  ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
  --role-name grocery-app-external-secrets-role \
  --policy-name grocery-app-secrets-access \
  --policy-document file://secrets-policy.json
```

## Step 3: Update Kubernetes Manifests

### Update ServiceAccount with Your Account ID

Edit `02a-serviceaccount.yaml`:

```bash
# Replace YOUR_AWS_ACCOUNT_ID
sed -i "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" 02a-serviceaccount.yaml
```

### Update Region in 02-secrets.yaml

```bash
# If not using us-east-1, update:
sed -i 's/us-east-1/your-region/g' 02-secrets.yaml
```

### Update Image References

```bash
# Update Docker Hub username in deployment manifests
sed -i 's/YOUR_DOCKER_HUB_USERNAME/your-actual-username/g' 04-backend-deployment.yaml 05-frontend-deployment.yaml
```

## Step 4: Deploy External Secrets Operator

```bash
# Install External Secrets Operator first
kubectl apply -f 00-external-secrets-operator.yaml

# Wait for operator to be ready
kubectl rollout status deployment/external-secrets-operator -n external-secrets --timeout=5m

# Verify operator is running
kubectl get pods -n external-secrets
```

## Step 5: Deploy Application Secrets

```bash
# Deploy namespace
kubectl apply -f 01-namespace.yaml

# Deploy ServiceAccount (with IAM role annotation)
kubectl apply -f 02a-serviceaccount.yaml

# Deploy ExternalSecrets (these will fetch from AWS Secrets Manager)
kubectl apply -f 02-secrets.yaml

# Wait for ExternalSecrets to sync
sleep 5
kubectl get externalsecrets -n grocery-app -w

# Verify Kubernetes Secrets were created
kubectl get secrets -n grocery-app
```

## Step 6: Deploy Your Application

```bash
# Deploy configurations and deployments
kubectl apply -f 03-configmap.yaml
kubectl apply -f 04-backend-deployment.yaml
kubectl apply -f 05-frontend-deployment.yaml
kubectl apply -f 06-backend-service.yaml
kubectl apply -f 07-frontend-service.yaml
kubectl apply -f 09-hpa.yaml

# Verify deployment
kubectl get pods -n grocery-app -w
```

## Monitoring and Troubleshooting

### Check ExternalSecret Status

```bash
# View ExternalSecret status
kubectl get externalsecrets -n grocery-app

# Describe specific ExternalSecret
kubectl describe externalsecret docker-hub-credentials -n grocery-app

# Check if Kubernetes Secret was created
kubectl get secret docker-hub-credentials -n grocery-app
kubectl get secret grocery-db-credentials -n grocery-app
kubectl get secret app-secrets -n grocery-app
```

### View External Secrets Operator Logs

```bash
kubectl logs -f deployment/external-secrets-operator -n external-secrets
```

### Common Issues

**ExternalSecret stuck in "Pending":**

```bash
# Check operator logs
kubectl logs -f deployment/external-secrets-operator -n external-secrets

# Check ServiceAccount permissions
kubectl describe sa external-secrets-sa -n grocery-app

# Verify IAM role has correct policy
aws iam list-role-policies --role-name grocery-app-external-secrets-role
```

**Secret not syncing from AWS:**

```bash
# Check AWS Secrets Manager access
aws secretsmanager get-secret-value \
  --secret-id grocery-app/db-host \
  --region us-east-1

# Verify secret exists by trying to list
aws secretsmanager list-secrets \
  --filters Key=name,Values=grocery-app \
  --region us-east-1
```

### View Synced Secrets

```bash
# DO NOT do this in production! (exposes passwords)
# For debugging only:

kubectl get secret app-secrets -n grocery-app -o jsonpath='{.data.JWT_SECRET}' | base64 -d
kubectl get secret grocery-db-credentials -n grocery-app -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

## How It Works

1. **External Secrets Operator** runs in `external-secrets` namespace
2. **ServiceAccount** in `grocery-app` namespace has IAM role that can access AWS Secrets Manager
3. **ExternalSecret** resources define which AWS secrets to sync
4. **Operator watches** ExternalSecrets and automatically creates/updates Kubernetes Secrets
5. **Pods** read from Kubernetes Secrets (which came from AWS)
6. **Everything is automatic** - if you update a secret in AWS, it syncs to K8s within 1 hour (configurable)

## Security Benefits

✅ **No hardcoded credentials** - Everything in AWS Secrets Manager
✅ **Automatic rotation** - Update in AWS, it propagates automatically
✅ **Audit trail** - AWS CloudTrail logs all access
✅ **IAM-based access** - Only pods with correct role can fetch
✅ **Encryption** - Secrets encrypted in AWS and in transit
✅ **Least privilege** - ServiceAccount only has access to `grocery-app/*` secrets

## Updating Secrets

When you need to change a secret:

```bash
# Update in AWS
aws secretsmanager update-secret \
  --secret-id grocery-app/db-password \
  --secret-string "new-password" \
  --region us-east-1

# Wait up to 1 hour for sync, or manually restart pods to force refresh
kubectl rollout restart deployment/backend -n grocery-app
kubectl rollout restart deployment/frontend -n grocery-app
```

## Cleanup

```bash
# Delete all Kubernetes resources
kubectl delete namespace grocery-app
kubectl delete namespace external-secrets

# Delete IAM role and policy
aws iam delete-role-policy \
  --role-name grocery-app-external-secrets-role \
  --policy-name grocery-app-secrets-access

aws iam delete-role \
  --role-name grocery-app-external-secrets-role

# Delete AWS secrets (optional)
aws secretsmanager delete-secret \
  --secret-id grocery-app/docker-hub-auth \
  --force-delete-without-recovery \
  --region us-east-1
# Repeat for other secrets...
```

## References

- [External Secrets Operator Documentation](https://external-secrets.io/)
- [AWS Secrets Manager Integration](https://external-secrets.io/providers/aws-secrets-manager/)
- [IAM Roles for Service Accounts (IRSA)](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
