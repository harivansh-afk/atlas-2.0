# Atlas Backend Deployment Guide

This guide provides multiple scalable deployment options for the Atlas backend application.

## Quick Start

Your backend is already containerized and production-ready. Choose the deployment option that best fits your needs:

- **Docker Swarm**: Easiest to set up, good for small to medium scale
- **Kubernetes**: Most scalable, best for large-scale production
- **AWS ECS**: Managed containers with AWS integration
- **Google Cloud Run**: Serverless, automatic scaling

## Prerequisites

1. **Environment Variables**: Update your `.env` file for production
2. **Secrets Management**: Store sensitive keys securely
3. **Database**: Ensure Supabase is configured for production
4. **Container Registry**: Push your image to a registry

## Deployment Options

### 1. Docker Swarm (Recommended for Getting Started)

**Pros**: Simple setup, built-in load balancing, easy scaling
**Best for**: Small to medium applications, teams new to orchestration

```bash
cd backend/deploy/docker-swarm
chmod +x deploy.sh
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
./deploy.sh
```

**Scaling**:
```bash
docker service scale atlas_api=10 atlas_worker=5
```

### 2. Kubernetes (Most Scalable)

**Pros**: Auto-scaling, rolling updates, multi-cloud support
**Best for**: Large-scale production, complex deployments

```bash
cd backend/deploy/kubernetes

# Create secrets
kubectl create secret generic atlas-secrets \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="your-key" \
  --from-literal=ANTHROPIC_API_KEY="your-key"

# Deploy infrastructure
kubectl apply -f redis.yaml

# Deploy application
kubectl apply -f deployment.yaml
```

### 3. AWS ECS Fargate (Managed Containers)

**Pros**: Serverless containers, AWS integration, managed infrastructure
**Best for**: AWS-centric deployments, teams wanting managed services

```bash
cd backend/deploy/aws-ecs
chmod +x deploy.sh

# Update configuration in task-definition.json
# Set up AWS CLI and ECR repository
./deploy.sh
```

### 4. Google Cloud Run (Serverless)

**Pros**: Pay-per-use, automatic scaling, zero infrastructure management
**Best for**: Variable workloads, cost optimization

```bash
cd backend/deploy/cloud-run
chmod +x deploy.sh

# Set up gcloud CLI
gcloud auth login
gcloud config set project your-project-id

./deploy.sh
```

## Production Considerations

### 1. Environment Configuration

Update your `.env` file for production:

```env
ENV_MODE=production
REDIS_HOST=your-redis-endpoint
RABBITMQ_HOST=your-rabbitmq-endpoint
# Use managed services for Redis/RabbitMQ in production
```

### 2. Managed Services (Recommended)

Instead of self-hosting Redis/RabbitMQ, use managed services:

- **Redis**: AWS ElastiCache, Google Cloud Memorystore, Azure Cache
- **RabbitMQ**: AWS MQ, Google Cloud Pub/Sub, Azure Service Bus

### 3. Monitoring & Logging

Your application includes:
- Health checks at `/api/health`
- Structured logging
- Sentry integration for error tracking

Add monitoring with:
- Prometheus + Grafana
- AWS CloudWatch
- Google Cloud Monitoring

### 4. Security

- Store secrets in secure vaults (AWS Secrets Manager, etc.)
- Use HTTPS with SSL certificates
- Configure proper CORS origins
- Enable authentication/authorization

## Scaling Guidelines

### Horizontal Scaling

- **API servers**: Scale based on CPU/memory usage
- **Workers**: Scale based on queue length
- **Database**: Use read replicas for read-heavy workloads

### Resource Allocation

Based on your current configuration:
- **API**: 2-4 CPU cores, 4-8GB RAM per instance
- **Worker**: 2-4 CPU cores, 4-8GB RAM per instance
- **Redis**: 1-2 CPU cores, 8-16GB RAM
- **RabbitMQ**: 1-2 CPU cores, 4-8GB RAM

## Troubleshooting

### Common Issues

1. **Health check failures**: Check `/api/health` endpoint
2. **Database connection**: Verify Supabase credentials
3. **Redis/RabbitMQ**: Ensure services are accessible
4. **Memory issues**: Monitor worker memory usage

### Debugging Commands

```bash
# Docker Swarm
docker service logs atlas_api
docker service ps atlas_api

# Kubernetes
kubectl logs deployment/atlas-api
kubectl describe pod atlas-api-xxx

# Check health
curl http://your-endpoint/api/health
```

## Next Steps

1. Choose your deployment method
2. Set up monitoring and alerting
3. Configure CI/CD pipeline
4. Set up backup and disaster recovery
5. Performance testing and optimization

For questions or issues, check the logs and health endpoints first.
