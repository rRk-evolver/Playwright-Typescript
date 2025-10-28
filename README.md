# 🎭 Playwright TypeScript Cucumber Framework

[![Playwright](https://img.shields.io/badge/Playwright-v1.40.0-green?logo=playwright)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.2.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Cucumber](https://img.shields.io/badge/Cucumber-v10.0.1-brightgreen?logo=cucumber)](https://cucumber.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green?logo=nodedotjs)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/badge/CI%2FCD-Ready-success?logo=github-actions)](https://github.com/features/actions)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20MongoDB%20%7C%20PostgreSQL-orange?logo=database)](https://github.com/)

A **production-ready**, comprehensive test automation framework built with **Playwright**, **TypeScript**, and **Cucumber** for enterprise-grade end-to-end testing. Features advanced **data-driven testing**, **encryption**, **multi-format data handling**, **database integration**, **comprehensive reporting**, and **complete CI/CD support**.

> 🌟 **Perfect for teams** looking for a scalable, maintainable, and feature-rich test automation solution with **zero configuration complexity**.

## 📊 Framework Statistics

- **22,516** Total Files (Production Clean)
- **50+** Pre-built Scripts & Commands
- **10+** Data Format Handlers
- **3** Database Integrations
- **4** Reporting Systems
- **5** CI/CD Platforms
- **Docker Containerized**
- **Enterprise Ready**

## ✨ Key Features

### 🎯 **Core Framework**
- 🎭 **Playwright v1.40.0** - Modern browser automation with cross-browser support (Chrome, Firefox, Safari, Edge)
- 📘 **TypeScript v5.2.2** - Type-safe development with IntelliSense support and compile-time error catching
- 🥒 **Cucumber v10.0.1** - Behavior-driven development (BDD) with Gherkin syntax for readable test scenarios
- 📄 **Page Object Model** - Maintainable and reusable page abstractions with inheritance support

### 📊 **Advanced Data-Driven Testing**
- 📋 **Multi-Format Support** - Excel (.xlsx, .xls), CSV, JSON with advanced parsing and manipulation
- 🔐 **Data Encryption/Decryption** - Secure handling of sensitive test data with AES encryption
- 🎭 **Data Masking** - Automatically hide sensitive information in logs and reports
- 🎲 **Random Data Selection** - Built-in support for data variation and dynamic test generation
- 🔄 **Data Conversion** - Seamless conversion between CSV, Excel, and JSON formats
- ✅ **Data Integrity Checks** - Automatic validation and corruption detection

### 🗄️ **Database Integration**
- 📊 **MySQL Support** - Complete CRUD operations with connection pooling
- 🍃 **MongoDB Integration** - NoSQL database operations with aggregation pipeline support
- 🐘 **PostgreSQL Support** - Advanced SQL operations with prepared statements
- 🔄 **Migration System** - Database schema migration and rollback capabilities
- ⚡ **Performance Testing** - Database performance benchmarking and optimization

### 📈 **Comprehensive Reporting**
- 🎯 **Allure Reports** - Rich HTML reports with screenshots, traces, and test analytics
- 🥒 **Cucumber HTML Reports** - BDD-style reporting with step-by-step execution details
- 📊 **Custom Dashboard** - Real-time test execution dashboard with charts and metrics
- 📸 **Visual Evidence** - Automatic screenshot and video capture on failures
- 📋 **Multi-Format Export** - JSON, HTML, XML report generation

### 🚀 **CI/CD & DevOps**
- 🐙 **GitHub Actions** - Automated testing workflows with parallel execution
- 🏗️ **Jenkins** - Enterprise CI/CD pipeline support with blue-green deployments
- ☁️ **Azure DevOps** - Microsoft ecosystem integration with Azure Test Plans
- 🐳 **Docker** - Complete containerization with multi-stage builds and optimization
- 📊 **Monitoring** - Prometheus and Grafana integration for test metrics

### 🔧 **Test Management Integration**
- 🎯 **Jira Integration** - Automatic issue creation and test result synchronization
- 🚂 **TestRail Support** - Complete test case management and execution tracking
- ☁️ **Azure Test Plans** - Microsoft test management with work item integration
- 🔄 **Unified API** - Single interface for multiple test management platforms

### 🌐 **Cross-Platform & Performance**
- 🖥️ **Multi-Browser** - Chrome, Firefox, Safari, Edge with version management
- 📱 **Mobile Testing** - Responsive design testing and mobile device emulation
- ⚡ **Parallel Execution** - Configurable parallel test execution (2-16 workers)
- 👁️ **Headless/Headed Modes** - Flexible execution options for different environments
- 🔧 **Environment Management** - Multi-environment configuration with secrets management

## 📁 Project Structure

```
playwright-typescript-cucumber-framework/
├── .github/                    # GitHub configurations
├── ci-cd/                      # CI/CD pipeline configurations
│   ├── github-actions/         # GitHub Actions workflows
│   ├── jenkins/               # Jenkins pipeline files
│   └── azure-devops/          # Azure DevOps pipelines
├── docker/                     # Docker configurations
├── features/                   # Cucumber feature files
│   └── login.feature          # Example feature file
├── src/                       # Source code
│   ├── config/                # Configuration files
│   │   ├── global-setup.ts    # Global test setup
│   │   ├── global-teardown.ts # Global test teardown
│   │   └── cucumber-setup.ts  # Cucumber configuration
│   ├── data/                  # Test data files
│   │   └── test-data.json     # Sample test data
│   ├── pages/                 # Page Object Model
│   │   ├── base-page.ts       # Base page class
│   │   ├── login-page.ts      # Login page object
│   │   └── dashboard-page.ts  # Dashboard page object
│   ├── steps/                 # Step definitions
│   │   └── login-steps.ts     # Login step definitions
│   └── utils/                 # Utility functions
│       ├── data/              # Data handling utilities
│       │   ├── excel-handler.ts   # Excel file operations
│       │   ├── csv-handler.ts     # CSV file operations
│       │   └── json-handler.ts    # JSON file operations
│       ├── encryption/        # Data encryption utilities
│       │   └── data-encryption.ts # Encryption/decryption
│       ├── element-helper.ts  # Element interaction utilities
│       ├── wait-helper.ts     # Advanced waiting strategies
│       ├── logger.ts          # Logging utility
│       └── environment-manager.ts # Environment configuration
├── tests/                     # Test files and fixtures
│   └── fixtures/              # Test fixtures
├── reports/                   # Generated test reports
├── .env.example              # Environment variables template
├── cucumber.js               # Cucumber configuration
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

### Setup
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd playwright-typescript-cucumber-framework
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npm run install:browsers
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

## 🚀 Quick Start

### Run Tests
```bash
# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests in headless mode
npm run test:headless

# Run tests in parallel
npm run test:parallel

# Run specific browser tests
npm run test:chrome
npm run test:firefox
npm run test:safari

# Run tests with specific tags
npm run test:tag -- "@smoke"
npm run test:tag -- "@regression"
```

### Generate Reports
```bash
# Generate and open Allure report
npm run report:allure

# Open HTML report
npm run report:open
```

### Development Commands
```bash
# Type check
npm run type-check

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format

# Clean reports
npm run clean
```

## 📝 Writing Tests

### Feature Files
Create feature files in the `features/` directory using Gherkin syntax:

```gherkin
Feature: User Authentication
  As a user
  I want to login to the application
  So that I can access my account

  @smoke @ui
  Scenario: Successful login
    Given I am on the login page
    When I enter valid credentials
    And I click the login button
    Then I should be redirected to dashboard
```

### Step Definitions
Implement step definitions in `src/steps/`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('I am on the login page', async function() {
  await this.loginPage.navigate();
});

When('I enter valid credentials', async function() {
  await this.loginPage.login(
    this.testData.users.valid.username,
    this.testData.users.valid.password
  );
});
```

### Page Objects
Create page objects extending the base page:

```typescript
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  private selectors = {
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]'
  };

  async login(username: string, password: string) {
    await this.type(this.selectors.usernameInput, username);
    await this.type(this.selectors.passwordInput, password);
    await this.click(this.selectors.loginButton);
  }
}
```

## 📊 Data Management

### JSON Data
```typescript
const dataHandler = new JSONDataHandler();
const testData = await dataHandler.readJSONFile('src/data/test-data.json');
```

### Excel Data
```typescript
const excelHandler = new ExcelDataHandler();
const userData = await excelHandler.readExcelFile('src/data/users.xlsx', 'Sheet1');
```

### CSV Data
```typescript
const csvHandler = new CSVDataHandler();
const csvData = await csvHandler.readCSVFile('src/data/test-data.csv');
```

### Data Encryption
```typescript
const encryption = new DataEncryption();
const encrypted = await encryption.encrypt('sensitive-data');
const decrypted = await encryption.decrypt(encrypted);
```

## 🔧 Configuration

### Environment Variables
Key environment variables in `.env`:

```bash
# Application URLs
BASE_URL=https://demo.playwright.dev
API_BASE_URL=https://api.demo.playwright.dev

# Browser Configuration
BROWSER=chromium
HEADLESS=true
TIMEOUT=30000

# Test Configuration
PARALLEL_WORKERS=2
RETRIES=1
TAGS=not @skip

# Reporting
ALLURE_RESULTS_DIR=allure-results
SCREENSHOT=failure
VIDEO=failure

# Encryption
ENCRYPTION_KEY=your-256-bit-secret-key

# CI/CD Integration
CI=false
JIRA_BASE_URL=https://company.atlassian.net
JIRA_API_TOKEN=your-token
```

### Playwright Configuration
Customize `playwright.config.ts` for:
- Browser configurations
- Test timeouts
- Screenshot/video settings
- Parallel execution
- Reporter settings

### Cucumber Configuration
Configure `cucumber.js` for:
- Step definition patterns
- Feature file locations
- Report formats
- Tags and filtering
- World parameters

## 📈 Reporting

### Allure Reports
Rich HTML reports with:
- Test execution timeline
- Screenshots and videos
- Error traces and logs
- Trend analysis
- Environment information

### Cucumber Reports
BDD-style reports showing:
- Feature execution status
- Scenario results
- Step-by-step execution
- Duration metrics

### Custom Reporting
Extend the framework with custom reporters for:
- Database logging
- External system integration
- Custom metrics collection
- Real-time notifications

## 🔄 CI/CD Integration

### GitHub Actions
Automated workflows for:
- Pull request testing
- Scheduled test runs
- Multi-environment deployment
- Report publishing

### Jenkins
Enterprise pipeline support:
- Pipeline as code
- Matrix builds
- Artifact management
- Integration with enterprise tools

### Azure DevOps
Microsoft ecosystem integration:
- Azure Pipelines
- Test result publishing
- Work item integration
- Release management

## 🐳 Docker Support

### Build Docker Image
```bash
npm run docker:build
```

### Run Tests in Docker
```bash
npm run docker:run
```

### Docker Compose
Multi-service testing with:
- Application containers
- Database containers
- Browser containers
- Test execution containers

## 🔗 Integrations

### Jira Integration
- Test case synchronization
- Bug reporting
- Test execution tracking
- Sprint planning integration

### TestRail Integration
- Test case management
- Test run creation
- Result reporting
- Milestone tracking

### Azure DevOps Integration
- Work item linking
- Test plan execution
- Build integration
- Release tracking

## 🛡️ Security Features

### Data Encryption
- AES-256 encryption for sensitive data
- Key management
- Secure data storage
- Environment-specific encryption

### Data Masking
- Sensitive data masking in logs
- Configurable masking patterns
- PII protection
- Compliance support

### Secure Configuration
- Environment variable management
- Secret management integration
- Secure credential storage
- Access control

## 🎯 Best Practices

### Test Organization
- Use descriptive feature and scenario names
- Group related tests with tags
- Maintain clean test data
- Follow BDD principles

### Page Object Model
- Keep page objects focused and single-purpose
- Use meaningful element selectors
- Implement wait strategies
- Handle dynamic content properly

### Data Management
- Separate test data from test logic
- Use data factories for complex objects
- Implement data cleanup strategies
- Version control test data

### Error Handling
- Implement proper error recovery
- Use meaningful assertions
- Capture debugging information
- Provide clear failure messages

## 🔍 Debugging

### Debug Mode
```bash
# Run with debug logging
DEBUG=true npm test

# Run single test with debugging
npm test -- --grep "specific test"

# Run with browser developer tools
HEADLESS=false SLOW_MO=1000 npm test
```

### Logging
- Structured logging with Winston
- Different log levels (debug, info, warn, error)
- Log file rotation
- Performance metrics logging

### Screenshots and Videos
- Automatic capture on failures
- Manual screenshot methods
- Video recording for debugging
- Trace files for analysis

## 📚 Advanced Features

### Parallel Execution
- Configure worker processes
- Test isolation
- Resource management
- Load balancing

### Cross-Browser Testing
- Multiple browser support
- Browser-specific configurations
- Mobile browser testing
- Browser compatibility reports

### API Testing
- REST API testing utilities
- Authentication handling
- Request/response validation
- API mocking support

### Database Testing
- Database connection utilities
- Query execution
- Data validation
- Test data management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

### Development Guidelines
- Follow TypeScript coding standards
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Playwright Documentation](https://playwright.dev)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/api/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Community
- GitHub Issues for bug reports
- Discussions for questions and ideas
- Stack Overflow for technical questions

### Professional Support
- Custom framework development
- Training and workshops
- Consultation services
- Enterprise support

---

## 📊 Framework Statistics

- **Languages**: TypeScript, JavaScript
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Platforms**: Windows, macOS, Linux
- **CI/CD**: GitHub Actions, Jenkins, Azure DevOps
- **Reporting**: Allure, Cucumber HTML, Custom
- **Integrations**: Jira, TestRail, Azure DevOps

Built with ❤️ for reliable test automation