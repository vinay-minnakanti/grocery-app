# Kubernetes Deployment Guide for Grocery App

This guide explains how to deploy the Grocery App to AWS EKS cluster (`grocery-app-cluster`).

## Prerequisites

- AWS EKS cluster running (`grocery-app-cluster`)
- `kubectl` configured to access your cluster
- AWS Secrets Manager containing database credentials
- Private Docker Hub images pushed and ready
- AWS Load Balancer Controller installed (✓ You have this)
- CloudWatch monitoring enabled (✓ You have this)

## Kubernetes Manifests Overview

```
kubernetes/
├── 01-namespace.yaml           # Create grocery-app namespace
├── 02-secrets.yaml             # Database & app secrets
├── 03-configmap.yaml           # Nginx configuration
├── 04-backend-deployment.yaml  # Backend pods (2 replicas, auto-scaling)
├── 05-frontend-deployment.yaml # Frontend pods (2 replicas, auto-scaling)
├── 06-backend-service.yaml     # Internal ClusterIP service
├── 07-frontend-service.yaml    # Public LoadBalancer service
├── 08-ingress.yaml             # Optional: ALB Ingress routing
└── 09-hpa.yaml                 # Auto-scaling rules
```

## Step 1: Configure Secrets

### Option A: Create Secrets Manually (Not Recommended for Production)

**Edit `02-secrets.yaml` and replace these values:**

```yaml
grocery-db-credentials:
  DB_HOST: your-rds-endpoint.us-east-1.rds.amazonaws.com
  DB_USER: admin
  DB_PASSWORD: your-rds-password
  DB_NAME: grocery_db

app-secrets:
  JWT_SECRET: your-jwt-secret-from-secrets-manager
```

### Option B: Use AWS Secrets Manager (Recommended)

```bash
# Store database credentials in AWS Secrets Manager
aws secretsmanager create-secret \
  --name grocery-app/db-credentials \
  --secret-string '{
    "DB_HOST": "your-rds-endpoint.us-east-1.rds.amazonaws.com",
    "DB_USER": "admin",
    "DB_PASSWORD": "your-password",
    "DB_NAME": "grocery_db"
  }'

# Store JWT secret
aws secretsmanager create-secret \
  --name grocery-app/jwt-secret \
  --secret-string "your-jwt-secret-key"
```

Then reference in Kubernetes using External Secrets Operator (advanced, optional).

### Create Docker Hub Credentials Secret

```bash
# Create docker-registry secret
kubectl create secret docker-registry docker-hub-credentials \
  --docker-server=docker.io \
  --docker-username=YOUR_DOCKER_HUB_USERNAME \
  --docker-password=YOUR_DOCKER_HUB_PASSWORD \
  --docker-email=your-email@example.com \
  -n grocery-app
```

## Step 2: Update Image References

**In manifests `04-backend-deployment.yaml` and `05-frontend-deployment.yaml`:**

Replace `YOUR_DOCKER_HUB_USERNAME` with your actual Docker Hub username:

```bash
# Quick replace
sed -i 's/YOUR_DOCKER_HUB_USERNAME/your-actual-username/g' kubernetes/*.yaml
```

## Step 3: Deploy to EKS

### Deploy All Manifests

```bash
# Apply manifests in order
kubectl apply -f kubernetes/01-namespace.yaml
kubectl apply -f kubernetes/02-secrets.yaml
kubectl apply -f kubernetes/03-configmap.yaml
kubectl apply -f kubernetes/04-backend-deployment.yaml
kubectl apply -f kubernetes/05-frontend-deployment.yaml
kubectl apply -f kubernetes/06-backend-service.yaml
kubectl apply -f kubernetes/07-frontend-service.yaml
kubectl apply -f kubernetes/09-hpa.yaml

# Optional: Deploy Ingress if you have a domain
# kubectl apply -f kubernetes/08-ingress.yaml
```

Or apply everything at once:

```bash
kubectl apply -f kubernetes/
```

## Step 4: Verify Deployment

### Check Namespace and Resources

```bash
# List everything in grocery-app namespace
kubectl get all -n grocery-app

# Check pods are running
kubectl get pods -n grocery-app -w

# Check services
kubectl get svc -n grocery-app
```

### Get LoadBalancer Public IP

```bash
# Watch for external IP to be assigned
kubectl get svc frontend-service -n grocery-app -w

# Once assigned, note the EXTERNAL-IP
# This is your public endpoint!
```

### Check Deployment Status

```bash
# Backend deployment
kubectl describe deployment backend -n grocery-app
kubectl logs deployment/backend -n grocery-app

# Frontend deployment
kubectl describe deployment frontend -n grocery-app
kubectl logs deployment/frontend -n grocery-app
```

## Step 5: Access Your Application

Once LoadBalancer has external IP:

```
http://<EXTERNAL-IP>
```

Example: `http://a1b2c3d4-1234567890.us-east-1.elb.amazonaws.com`

## Health Checks

### Backend Health

```bash
# Port-forward to backend (optional, for testing)
kubectl port-forward svc/backend-service 5000:5000 -n grocery-app

# Check health
curl http://localhost:5000/api/health
# Response: {"status":"OK"}
```

### Frontend Health

```bash
# Port-forward to frontend (optional, for testing)
kubectl port-forward svc/frontend-service 3000:3000 -n grocery-app

# Check health
curl http://localhost:3000/health
# Response: healthy
```

## Monitoring & Management

### View Logs

```bash
# Backend logs (real-time)
kubectl logs -f deployment/backend -n grocery-app --all-containers=true

# Frontend logs
kubectl logs -f deployment/frontend -n grocery-app --all-containers=true

# Specific pod
kubectl logs -f pod/backend-xxxx-yyyy -n grocery-app
```

### Monitor Pod Resources

```bash
# Watch resource usage (requires metrics-server, which you have)
kubectl top pods -n grocery-app
kubectl top nodes
```

### Check Scaling

```bash
# View HPA status
kubectl get hpa -n grocery-app
kubectl describe hpa backend-hpa -n grocery-app

# View current replicas
kubectl get deployment -n grocery-app -o wide
```

## Scale Manually

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n grocery-app

# Scale frontend to 2 replicas
kubectl scale deployment frontend --replicas=2 -n grocery-app
```

## Update Deployment

### Update Configuration

```bash
# Edit application configuration
kubectl edit deployment backend -n grocery-app

# Or apply updated manifest
kubectl apply -f kubernetes/04-backend-deployment.yaml
```

### Rollout New Image Version

```bash
# When you push new image to Docker Hub
kubectl set image deployment/backend \
  backend=YOU_RNAME/grocery-backend:v2.0 \
  -n grocery-app

# Check rollout status
kubectl rollout status deployment/backend -n grocery-app
```

### Rollback If Needed

```bash
# View rollout history
kubectl rollout history deployment/backend -n grocery-app

# Rollback to previous version
kubectl rollout undo deployment/backend -n grocery-app
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n grocery-app

# Check events
kubectl get events -n grocery-app --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n grocery-app
```

### LoadBalancer Pending

```bash
# Check service status
kubectl describe svc frontend-service -n grocery-app

# Check if load balancer controller is working
kubectl get pods -n kube-system | grep load-balancer

# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### CrashLoopBackOff

```bash
# Check logs for errors
kubectl logs <pod-name> -n grocery-app --previous

# Common issues:
# - Database connection failed (check secrets)
# - Missing environment variables
# - Image not found (check Docker Hub)
```

### Cannot Connect to Database

```bash
# Verify secrets exist
kubectl get secrets -n grocery-app

# Check secret values (careful with passwords!)
kubectl get secret grocery-db-credentials -n grocery-app -o jsonpath='{.data.DB_HOST}' | base64 -d

# Verify RDS is accessible from VPC
# Try port-forwarding and testing connection manually
```

## Cleanup

### Delete All Resources

```bash
# Delete entire namespace (cascades to all resources)
kubectl delete namespace grocery-app

# Or delete specific resources
kubectl delete -f kubernetes/ -n grocery-app
```

### Keep Data While Deleting

```bash
# Data in AWS RDS persists
# Only Kubernetes resources are deleted
```

## Production Checklist

- [ ] Database credentials in AWS Secrets Manager
- [ ] Docker images in private Docker Hub
- [ ] RDS endpoint configured
- [ ] SSL/TLS for HTTPS (via Ingress or ALB)
- [ ] Backup strategy for RDS
- [ ] CloudWatch alarms configured
- [ ] IAM roles for pod authentication
- [ ] Network policies for security
- [ ] Resource limits and requests verified
- [ ] Auto-scaling policies tested
- [ ] Monitoring and logging configured

## Next Steps

1. Deploy to EKS using above commands
2. Verify all pods are running
3. Test application via LoadBalancer IP
4. Configure CloudWatch dashboards
5. Set up CI/CD pipeline for auto-deployment
6. Configure HTTPS/TLS
7. Set up backup and disaster recovery

## Support

For issues, check:
- Kubernetes logs: `kubectl logs -f <pod> -n grocery-app`
- Events: `kubectl get events -n grocery-app`
- AWS Console: EKS Cluster → Resources → Workloads
