# Docker Setup for Playwright Cucumber Framework

This directory contains Docker configurations for running the Playwright Cucumber test framework in containerized environments.

## 📁 Directory Structure

```
docker/
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml            # Main Docker Compose configuration
├── docker-compose.dev.yml        # Development environment overrides
├── docker-compose.ci.yml         # CI/CD environment overrides
├── docker-utils.sh               # Bash utility script for Docker management
├── docker-utils.ps1              # PowerShell utility script for Windows
├── nginx/
│   └── nginx.conf                # NGINX configuration for serving reports
└── monitoring/
    ├── prometheus.yml            # Prometheus configuration
    └── grafana/                  # Grafana dashboards and datasources
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB+ RAM recommended for parallel execution
- At least 10GB free disk space

### Basic Usage

```bash
# Build the Docker image
npm run docker:build

# Start services in development mode
npm run docker:up:dev

# Run tests
npm run docker:test

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 🏗️ Docker Images

### Multi-Stage Build

The Dockerfile uses multi-stage builds for optimization:

1. **Base Stage**: Common dependencies and setup
2. **Development Stage**: Full development environment with debugging tools
3. **Test Runner Stage**: Optimized for running tests
4. **CI Optimized Stage**: Minimal Alpine-based image for CI/CD
5. **Report Generator Stage**: Specialized for generating reports

### Image Sizes (Approximate)

- `playwright-cucumber:dev` - 2.5GB (includes debugging tools)
- `playwright-cucumber:ci` - 800MB (Alpine-based, optimized)
- `playwright-cucumber:prod` - 600MB (Production-ready)

## 🐳 Docker Compose Services

### Core Services

| Service            | Description           | Ports            | Environment |
| ------------------ | --------------------- | ---------------- | ----------- |
| `playwright-tests` | Main test runner      | -                | All         |
| `selenium-hub`     | Selenium Grid Hub     | 4444, 4442, 4443 | CI/Parallel |
| `chrome-node`      | Chrome browser nodes  | -                | CI/Parallel |
| `firefox-node`     | Firefox browser nodes | -                | CI/Parallel |
| `edge-node`        | Edge browser nodes    | -                | CI/Parallel |

### Supporting Services

| Service         | Description        | Ports | Profile    |
| --------------- | ------------------ | ----- | ---------- |
| `nginx-reports` | Report server      | 8080  | reporting  |
| `test-database` | PostgreSQL test DB | 5432  | database   |
| `redis`         | Caching service    | 6379  | cache      |
| `prometheus`    | Monitoring         | 9090  | monitoring |
| `grafana`       | Dashboards         | 3000  | monitoring |

## 🔧 Configuration

### Environment Variables

| Variable           | Description              | Default                            | Environments |
| ------------------ | ------------------------ | ---------------------------------- | ------------ |
| `NODE_ENV`         | Node environment         | development                        | All          |
| `HEADLESS`         | Browser headless mode    | true                               | All          |
| `BROWSER`          | Browser to use           | chromium                           | All          |
| `TEST_ENV`         | Test environment         | staging                            | All          |
| `TAGS`             | Cucumber tags            | @smoke                             | All          |
| `PARALLEL_WORKERS` | Parallel execution count | 2                                  | All          |
| `SCREENSHOT`       | Screenshot mode          | failure                            | All          |
| `VIDEO`            | Video recording mode     | failure                            | All          |
| `TRACE`            | Playwright trace mode    | retain-on-failure                  | All          |
| `BASE_URL`         | Application base URL     | https://the-internet.herokuapp.com | All          |

### Profiles

Docker Compose profiles allow selective service startup:

- `dev` - Development services
- `ci` - CI/CD optimized services
- `reporting` - Report generation and serving
- `database` - Test database services
- `cache` - Redis caching
- `monitoring` - Prometheus and Grafana

## 📋 Usage Examples

### Development Environment

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile dev up -d

# Run tests with debugging
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml run --rm \
  -e HEADLESS=false \
  -e SCREENSHOT=always \
  -e VIDEO=always \
  playwright-tests

# Access container for debugging
docker-compose -f docker/docker-compose.yml exec playwright-tests /bin/bash
```

### CI/CD Environment

```bash
# Start CI environment
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.ci.yml --profile ci up -d

# Run parallel tests
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.ci.yml run --rm \
  -e BROWSER=chromium \
  -e TAGS="@smoke or @regression" \
  -e PARALLEL_WORKERS=4 \
  playwright-tests
```

### Cross-Browser Testing

```bash
# Chrome tests
npm run docker:test:chrome

# Firefox tests
npm run docker:test:firefox

# Edge tests
npm run docker:test:edge

# All browsers in parallel
for browser in chrome firefox edge; do
  docker-compose -f docker/docker-compose.yml -f docker/docker-compose.ci.yml run --rm \
    -e BROWSER=$browser \
    -e TAGS=@smoke \
    playwright-tests &
done
wait
```

### Report Generation and Serving

```bash
# Generate and serve reports
npm run docker:reports

# Access reports at http://localhost:8080
# - HTML reports: http://localhost:8080/reports/
# - Allure reports: http://localhost:8080/allure-report/
# - Screenshots: http://localhost:8080/screenshots/
# - Traces: http://localhost:8080/traces/
```

### Database Testing

```bash
# Start with test database
docker-compose -f docker/docker-compose.yml --profile database up -d

# Run database-dependent tests
docker-compose -f docker/docker-compose.yml run --rm \
  -e TAGS=@database \
  playwright-tests
```

### Monitoring Setup

```bash
# Start monitoring stack
docker-compose -f docker/docker-compose.yml --profile monitoring up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

## 🛠️ Utility Scripts

### Bash Script (Linux/macOS)

```bash
# Make executable
chmod +x docker/docker-utils.sh

# Build and test
./docker/docker-utils.sh build
./docker/docker-utils.sh test --browser chrome --tags "@smoke" --parallel 4

# Start services
./docker/docker-utils.sh up --env dev --profile "dev,database"

# Clean up
./docker/docker-utils.sh clean
```

### PowerShell Script (Windows)

```powershell
# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Build and test
.\docker\docker-utils.ps1 build
.\docker\docker-utils.ps1 test -Browser chrome -Tags "@smoke" -Parallel 4

# Start services
.\docker\docker-utils.ps1 up -Env dev -Profile "dev,database"

# Clean up
.\docker\docker-utils.ps1 clean
```

## 🔍 Troubleshooting

### Common Issues

1. **Out of Memory**

   ```bash
   # Increase Docker memory limit to at least 8GB
   # Check memory usage
   docker stats
   ```

2. **Port Conflicts**

   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :4444

   # Stop conflicting services
   docker-compose down
   ```

3. **Browser Launch Failures**

   ```bash
   # Check browser installation
   docker-compose exec playwright-tests npx playwright install --dry-run

   # Reinstall browsers
   docker-compose exec playwright-tests npx playwright install
   ```

4. **Permission Issues (Linux/macOS)**

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER reports/ screenshots/ traces/
   ```

5. **Selenium Grid Issues**

   ```bash
   # Check grid status
   curl http://localhost:4444/status

   # Restart grid
   docker-compose restart selenium-hub chrome-node firefox-node
   ```

### Debugging

```bash
# View detailed logs
docker-compose logs playwright-tests

# Check container health
docker-compose exec playwright-tests npm run health-check

# Access container shell
docker-compose exec playwright-tests /bin/bash

# View system resources
docker stats

# Inspect container
docker inspect playwright-cucumber-tests
```

### Performance Optimization

1. **Use Docker Layer Caching**

   ```dockerfile
   # Enable BuildKit
   export DOCKER_BUILDKIT=1
   ```

2. **Optimize for CI**

   ```bash
   # Use CI-optimized image
   docker build --target ci-optimized -t playwright-cucumber:ci .
   ```

3. **Parallel Execution**

   ```bash
   # Increase parallel workers based on CPU cores
   docker-compose run --rm -e PARALLEL_WORKERS=8 playwright-tests
   ```

4. **Volume Optimization**
   ```bash
   # Use named volumes for node_modules
   # Already configured in docker-compose.yml
   ```

## 📊 Monitoring and Metrics

### Prometheus Metrics

- Test execution time
- Success/failure rates
- Browser performance metrics
- Container resource usage

### Grafana Dashboards

- Test execution overview
- Browser performance comparison
- Error rate trends
- Resource utilization

### Custom Metrics

Add custom metrics to your tests:

```typescript
// In your test steps
await page.evaluate(() => {
  performance.mark("test-start");
  // Your test code
  performance.mark("test-end");
  performance.measure("test-duration", "test-start", "test-end");
});
```

## 🔐 Security Considerations

1. **Network Security**
   - Services communicate on isolated Docker network
   - No unnecessary port exposures
   - Use environment variables for sensitive data

2. **Image Security**
   - Regular base image updates
   - Non-root user execution
   - Minimal attack surface in production images

3. **Data Protection**
   - Encrypt sensitive test data
   - Use Docker secrets for credentials
   - Secure volume mounts

## 🚀 Production Deployment

### Container Registry

```bash
# Tag for registry
docker tag playwright-cucumber:prod your-registry.com/playwright-cucumber:latest

# Push to registry
docker push your-registry.com/playwright-cucumber:latest
```

### Kubernetes Deployment

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: playwright-tests
spec:
  replicas: 3
  selector:
    matchLabels:
      app: playwright-tests
  template:
    metadata:
      labels:
        app: playwright-tests
    spec:
      containers:
        - name: playwright-tests
          image: your-registry.com/playwright-cucumber:latest
          env:
            - name: NODE_ENV
              value: "production"
            - name: PARALLEL_WORKERS
              value: "4"
```

### Scaling

```bash
# Scale browser nodes
docker-compose up -d --scale chrome-node=4 --scale firefox-node=2

# Scale test runners
docker-compose up -d --scale playwright-tests=3
```

This Docker setup provides a robust, scalable, and maintainable environment for running Playwright Cucumber tests across different environments and deployment scenarios.
