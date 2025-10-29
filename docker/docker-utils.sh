#!/bin/bash

# Docker management script for Playwright Cucumber Framework
# Usage: ./docker-utils.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker/docker-compose.yml"
DEV_COMPOSE_FILE="docker/docker-compose.dev.yml"
CI_COMPOSE_FILE="docker/docker-compose.ci.yml"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Docker Utilities for Playwright Cucumber Framework

Usage: ./docker-utils.sh [command] [options]

Commands:
  build           Build Docker images
  up              Start services
  down            Stop services
  test            Run tests in containers
  logs            Show container logs
  clean           Clean up containers and volumes
  shell           Access container shell
  status          Show container status
  health          Check container health
  reports         Serve reports via NGINX

Options:
  --env [dev|ci|prod]     Environment (default: dev)
  --browser [chrome|firefox|edge]  Browser to use
  --tags [tag]            Cucumber tags to run
  --parallel [n]          Number of parallel workers
  --profile [profile]     Docker Compose profile

Examples:
  ./docker-utils.sh build
  ./docker-utils.sh up --env dev
  ./docker-utils.sh test --browser chrome --tags @smoke
  ./docker-utils.sh test --parallel 4 --tags @regression
  ./docker-utils.sh reports
  ./docker-utils.sh clean

EOF
}

# Parse command line arguments
COMMAND=""
ENV="dev"
BROWSER="chromium"
TAGS="@smoke"
PARALLEL="2"
PROFILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENV="$2"
            shift 2
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --tags)
            TAGS="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL="$2"
            shift 2
            ;;
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [[ -z "$COMMAND" ]]; then
                COMMAND="$1"
            fi
            shift
            ;;
    esac
done

# Set compose file based on environment
case $ENV in
    dev)
        COMPOSE_FILES="-f $COMPOSE_FILE -f $DEV_COMPOSE_FILE"
        ;;
    ci)
        COMPOSE_FILES="-f $COMPOSE_FILE -f $CI_COMPOSE_FILE"
        ;;
    prod)
        COMPOSE_FILES="-f $COMPOSE_FILE"
        ;;
    *)
        log_error "Invalid environment: $ENV"
        exit 1
        ;;
esac

# Add profile if specified
if [[ -n "$PROFILE" ]]; then
    PROFILE_FLAG="--profile $PROFILE"
else
    PROFILE_FLAG=""
fi

# Execute commands
case $COMMAND in
    build)
        log_info "Building Docker images for environment: $ENV"
        docker-compose $COMPOSE_FILES build
        log_success "Build completed"
        ;;

    up)
        log_info "Starting services for environment: $ENV"
        docker-compose $COMPOSE_FILES $PROFILE_FLAG up -d
        log_success "Services started"
        ;;

    down)
        log_info "Stopping services"
        docker-compose $COMPOSE_FILES down
        log_success "Services stopped"
        ;;

    test)
        log_info "Running tests with browser: $BROWSER, tags: $TAGS, parallel: $PARALLEL"
        docker-compose $COMPOSE_FILES run --rm \
            -e BROWSER=$BROWSER \
            -e TAGS="$TAGS" \
            -e PARALLEL_WORKERS=$PARALLEL \
            playwright-tests
        log_success "Tests completed"
        ;;

    logs)
        log_info "Showing container logs"
        docker-compose $COMPOSE_FILES logs -f
        ;;

    clean)
        log_warning "Cleaning up containers, images, and volumes"
        docker-compose $COMPOSE_FILES down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed"
        ;;

    shell)
        log_info "Accessing container shell"
        docker-compose $COMPOSE_FILES exec playwright-tests /bin/bash
        ;;

    status)
        log_info "Container status"
        docker-compose $COMPOSE_FILES ps
        ;;

    health)
        log_info "Checking container health"
        docker-compose $COMPOSE_FILES exec playwright-tests npm run health-check
        ;;

    reports)
        log_info "Starting report server"
        docker-compose -f $COMPOSE_FILE --profile reporting up -d nginx-reports
        log_success "Reports available at http://localhost:8080"
        ;;

    "")
        log_error "No command specified"
        show_help
        exit 1
        ;;

    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
