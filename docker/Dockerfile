# Multi-stage Dockerfile for Playwright Cucumber tests
FROM node:18-slim as base

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base as development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p reports screenshots traces logs

# Set environment variables
ENV NODE_ENV=development
ENV HEADLESS=true
ENV CI=true

# Expose port for potential dev server
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "test"]

# Production test runner stage
FROM base as test-runner

# Install Playwright and browsers
RUN npm install --save-dev @playwright/test @cucumber/cucumber ts-node typescript
RUN npx playwright install --with-deps

# Copy source code
COPY src/ ./src/
COPY features/ ./features/
COPY cucumber.js ./
COPY .env.example ./.env

# Create directories
RUN mkdir -p reports screenshots traces logs

# Set production environment variables
ENV NODE_ENV=production
ENV HEADLESS=true
ENV CI=true
ENV SCREENSHOT=failure
ENV VIDEO=failure
ENV TRACE=retain-on-failure

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Container is healthy')" || exit 1

# Run tests
CMD ["npm", "run", "test"]

# CI/CD optimized stage
FROM node:18-alpine as ci

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Chromium path for Playwright
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S playwright && \
    adduser -S playwright -u 1001 -G playwright

# Copy package files
COPY --chown=playwright:playwright package*.json ./
COPY --chown=playwright:playwright tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install Playwright
RUN npm install --save-dev @playwright/test @cucumber/cucumber ts-node typescript
RUN npx playwright install chromium

# Copy application code
COPY --chown=playwright:playwright . .

# Create necessary directories with correct permissions
RUN mkdir -p reports screenshots traces logs && \
    chown -R playwright:playwright /app

# Switch to non-root user
USER playwright

# Set environment variables
ENV NODE_ENV=production
ENV HEADLESS=true
ENV CI=true
ENV BROWSER=chromium

# Default command
CMD ["npm", "run", "test"]

# Report generator stage
FROM node:18-alpine as report-generator

WORKDIR /app

# Install dependencies for report generation
RUN npm init -y && \
    npm install multiple-cucumber-html-reporter allure-commandline

# Copy report generation utilities
COPY src/utils/enhanced-reporter.js ./
COPY package.json ./

# Create reports directory
RUN mkdir -p reports

# Set environment
ENV NODE_ENV=production

# Command to generate reports
CMD ["node", "enhanced-reporter.js"]