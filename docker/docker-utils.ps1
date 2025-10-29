# Docker management script for Playwright Cucumber Framework (PowerShell)
# Usage: .\docker-utils.ps1 [command] [options]

param(
    [string]$Command = "",
    [string]$Env = "dev",
    [string]$Browser = "chromium",
    [string]$Tags = "@smoke",
    [string]$Parallel = "2",
    [string]$Profile = "",
    [switch]$Help
)

# Configuration
$ComposeFile = "docker/docker-compose.yml"
$DevComposeFile = "docker/docker-compose.dev.yml"
$CiComposeFile = "docker/docker-compose.ci.yml"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Help {
    @"
Docker Utilities for Playwright Cucumber Framework (PowerShell)

Usage: .\docker-utils.ps1 [command] [options]

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
  -Env [dev|ci|prod]      Environment (default: dev)
  -Browser [chrome|firefox|edge]  Browser to use
  -Tags [tag]             Cucumber tags to run
  -Parallel [n]           Number of parallel workers
  -Profile [profile]      Docker Compose profile
  -Help                   Show this help

Examples:
  .\docker-utils.ps1 build
  .\docker-utils.ps1 up -Env dev
  .\docker-utils.ps1 test -Browser chrome -Tags "@smoke"
  .\docker-utils.ps1 test -Parallel 4 -Tags "@regression"
  .\docker-utils.ps1 reports
  .\docker-utils.ps1 clean

"@
}

# Show help if requested
if ($Help -or $Command -eq "") {
    Show-Help
    if ($Command -eq "") {
        Write-Error "No command specified"
        exit 1
    }
    exit 0
}

# Set compose files based on environment
switch ($Env) {
    "dev" {
        $ComposeFiles = "-f $ComposeFile -f $DevComposeFile"
    }
    "ci" {
        $ComposeFiles = "-f $ComposeFile -f $CiComposeFile"
    }
    "prod" {
        $ComposeFiles = "-f $ComposeFile"
    }
    default {
        Write-Error "Invalid environment: $Env"
        exit 1
    }
}

# Add profile if specified
$ProfileFlag = if ($Profile) { "--profile $Profile" } else { "" }

# Execute commands
switch ($Command.ToLower()) {
    "build" {
        Write-Info "Building Docker images for environment: $Env"
        $cmd = "docker-compose $ComposeFiles build"
        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build completed"
        } else {
            Write-Error "Build failed"
            exit 1
        }
    }

    "up" {
        Write-Info "Starting services for environment: $Env"
        $cmd = "docker-compose $ComposeFiles $ProfileFlag up -d"
        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services started"
        } else {
            Write-Error "Failed to start services"
            exit 1
        }
    }

    "down" {
        Write-Info "Stopping services"
        $cmd = "docker-compose $ComposeFiles down"
        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services stopped"
        } else {
            Write-Error "Failed to stop services"
            exit 1
        }
    }

    "test" {
        Write-Info "Running tests with browser: $Browser, tags: $Tags, parallel: $Parallel"
        $env:BROWSER = $Browser
        $env:TAGS = $Tags
        $env:PARALLEL_WORKERS = $Parallel

        $cmd = "docker-compose $ComposeFiles run --rm playwright-tests"
        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tests completed"
        } else {
            Write-Error "Tests failed"
            exit 1
        }
    }

    "logs" {
        Write-Info "Showing container logs"
        $cmd = "docker-compose $ComposeFiles logs -f"
        Invoke-Expression $cmd
    }

    "clean" {
        Write-Warning "Cleaning up containers, images, and volumes"
        $cmd1 = "docker-compose $ComposeFiles down -v --remove-orphans"
        $cmd2 = "docker system prune -f"

        Invoke-Expression $cmd1
        Invoke-Expression $cmd2

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Cleanup completed"
        } else {
            Write-Error "Cleanup failed"
            exit 1
        }
    }

    "shell" {
        Write-Info "Accessing container shell"
        $cmd = "docker-compose $ComposeFiles exec playwright-tests /bin/bash"
        Invoke-Expression $cmd
    }

    "status" {
        Write-Info "Container status"
        $cmd = "docker-compose $ComposeFiles ps"
        Invoke-Expression $cmd
    }

    "health" {
        Write-Info "Checking container health"
        $cmd = "docker-compose $ComposeFiles exec playwright-tests npm run health-check"
        Invoke-Expression $cmd
    }

    "reports" {
        Write-Info "Starting report server"
        $cmd = "docker-compose -f $ComposeFile --profile reporting up -d nginx-reports"
        Invoke-Expression $cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Reports available at http://localhost:8080"
        } else {
            Write-Error "Failed to start report server"
            exit 1
        }
    }

    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}

exit 0
