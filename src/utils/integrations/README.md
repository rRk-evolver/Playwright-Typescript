# Test Management Integrations

This directory contains comprehensive integrations for popular test management tools including Jira (with Xray/Zephyr) and TestRail.

## 📁 Directory Structure

```
src/utils/integrations/
├── jira-integration.ts              # Jira/Xray integration
├── testrail-integration.ts          # TestRail integration
├── test-management-integration.ts   # Unified integration manager
└── README.md                        # This file

src/config/
├── jira-config.json                 # Jira configuration
├── testrail-config.json            # TestRail configuration
└── test-management-config.json     # Unified configuration

examples/
├── jira-example.js                  # Jira usage examples
├── testrail-example.js             # TestRail usage examples
└── test-management-example.js      # Unified integration examples
```

## 🔧 Features

### Jira Integration
- ✅ Create and update test issues
- ✅ Create test executions
- ✅ Update test results with screenshots/attachments
- ✅ Link test cases to executions
- ✅ Create defects for failed tests
- ✅ Support for Xray and Zephyr plugins
- ✅ Bulk result updates from Cucumber JSON
- ✅ JQL search capabilities
- ✅ Custom fields support

### TestRail Integration
- ✅ Create and manage test cases
- ✅ Create test runs and test plans
- ✅ Add test results with detailed comments
- ✅ Upload attachments to results
- ✅ Milestone management
- ✅ Bulk result updates from Cucumber JSON
- ✅ Comprehensive execution reports
- ✅ Test case synchronization

### Unified Integration
- ✅ Single interface for both tools
- ✅ Parallel execution updates
- ✅ Cross-platform test case synchronization
- ✅ Unified reporting and analytics
- ✅ Configuration management
- ✅ Environment-specific settings

## 🚀 Quick Start

### 1. Configuration

#### Environment Variables
```bash
# Jira Configuration
export JIRA_BASE_URL="https://your-company.atlassian.net"
export JIRA_USERNAME="your-email@company.com"
export JIRA_API_TOKEN="your-jira-api-token"
export JIRA_PROJECT_KEY="TEST"

# TestRail Configuration
export TESTRAIL_BASE_URL="https://your-company.testrail.io"
export TESTRAIL_USERNAME="your-email@company.com"
export TESTRAIL_PASSWORD="your-testrail-password"
export TESTRAIL_PROJECT_ID="1"

# Integration Settings
export JIRA_ENABLED="true"
export TESTRAIL_ENABLED="true"
export DEFAULT_TEST_TOOL="both"
```

#### Configuration Files
Update the configuration files in `src/config/`:

**jira-config.json:**
```json
{
  "baseUrl": "https://your-company.atlassian.net",
  "username": "your-email@company.com",
  "apiToken": "your-jira-api-token",
  "projectKey": "TEST",
  "testExecutionIssueType": "Test Execution",
  "testIssueType": "Test"
}
```

**testrail-config.json:**
```json
{
  "baseUrl": "https://your-company.testrail.io",
  "username": "your-email@company.com",
  "password": "your-testrail-password",
  "projectId": 1
}
```

### 2. Basic Usage

#### Test Connections
```bash
# Test Jira connection
npm run jira:test-connection

# Test TestRail connection
npm run testrail:test-connection

# Test both connections
npm run test-mgmt:sync
```

#### Run Examples
```bash
# Jira integration example
npm run jira:example

# TestRail integration example
npm run testrail:example

# Unified integration example
npm run test-mgmt:example
```

## 📚 API Documentation

### Jira Integration

#### Creating Test Issues
```typescript
import { JiraIntegration } from './src/utils/integrations/jira-integration';

const jira = new JiraIntegration();

const testCase = await jira.createTestIssue(
    'Login functionality test',
    'Test to verify user login functionality',
    [
        { step: 'Navigate to login page', data: 'URL: /login', result: 'Login page displayed' },
        { step: 'Enter credentials', data: 'username/password', result: 'Credentials accepted' },
        { step: 'Click login', result: 'User logged in successfully' }
    ],
    'High'
);
```

#### Updating Test Results
```typescript
const testResults = [
    {
        testKey: 'TEST-123',
        status: 'PASS',
        executionTime: 2500,
        executedBy: 'automation-bot',
        executionDate: new Date().toISOString(),
        comment: 'Test executed successfully',
        attachments: ['screenshots/login-success.png']
    }
];

await jira.updateTestResults(testResults);
```

#### Creating Test Executions
```typescript
const execution = await jira.createTestExecution({
    key: '',
    summary: 'Sprint 23 Test Execution',
    description: 'Automated test execution for sprint 23',
    testResults: testResults,
    projectKey: 'TEST',
    version: '2.1.0',
    environment: 'staging'
});
```

### TestRail Integration

#### Creating Test Cases
```typescript
import { TestRailIntegration } from './src/utils/integrations/testrail-integration';

const testRail = new TestRailIntegration();

const testCase = await testRail.createTestCase(
    1, // section ID
    'User authentication test',
    TestRailIntegration.CASE_TYPE.AUTOMATED,
    TestRailIntegration.PRIORITY.HIGH,
    {
        steps: [
            { content: 'Open login page', expected: 'Page loads successfully' },
            { content: 'Enter valid credentials', expected: 'Fields accept input' },
            { content: 'Submit form', expected: 'User is authenticated' }
        ],
        preconditions: 'User account exists and is active'
    }
);
```

#### Creating Test Runs
```typescript
const testRun = await testRail.createTestRun(
    'Automated Test Run - Sprint 23',
    'Comprehensive test run for sprint 23 features',
    undefined, // suite ID
    [1, 2, 3, 4, 5], // test case IDs
    12 // milestone ID
);
```

#### Adding Test Results
```typescript
const results = [
    {
        test_id: 1,
        status_id: TestRailIntegration.STATUS.PASSED,
        comment: 'Test passed successfully with no issues',
        elapsed: '2m 30s',
        version: '2.1.0'
    },
    {
        test_id: 2,
        status_id: TestRailIntegration.STATUS.FAILED,
        comment: 'Login failed due to incorrect error message display',
        elapsed: '1m 45s',
        defects: 'BUG-456'
    }
];

await testRail.addTestResults(testRun.id, results);
```

### Unified Integration

#### Basic Setup
```typescript
import { TestManagementIntegration } from './src/utils/integrations/test-management-integration';

const testMgmt = new TestManagementIntegration({
    jira: { enabled: true },
    testrail: { enabled: true },
    defaultTool: 'both'
});
```

#### Creating Executions in Both Tools
```typescript
const testResults = [
    {
        testKey: 'TEST-123',      // Jira test key
        testId: 45,               // TestRail test case ID
        title: 'Login test',
        status: 'PASS',
        executionTime: 2500,
        executedBy: 'automation',
        executionDate: new Date().toISOString()
    }
];

const executionIds = await testMgmt.createTestExecution(
    'Sprint 23 Execution',
    'Automated test execution',
    testResults,
    {
        environment: 'staging',
        version: '2.1.0'
    }
);

// Returns: { jira: 'TEST-EX-123', testrail: 67 }
```

#### Processing Cucumber Reports
```typescript
await testMgmt.updateResultsFromCucumberReport(
    './reports/cucumber-report.json',
    {
        jiraExecutionKey: 'TEST-EX-123',
        testRailRunId: 67,
        testCaseMapping: {
            'Valid login with correct credentials': { jiraKey: 'TEST-1', testRailId: 1 },
            'Invalid login attempt': { jiraKey: 'TEST-2', testRailId: 2 }
        },
        version: '2.1.0',
        environment: 'staging'
    }
);
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: Test Execution with Test Management

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_USERNAME: ${{ secrets.JIRA_USERNAME }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          JIRA_PROJECT_KEY: ${{ secrets.JIRA_PROJECT_KEY }}
          TESTRAIL_BASE_URL: ${{ secrets.TESTRAIL_BASE_URL }}
          TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
          TESTRAIL_PASSWORD: ${{ secrets.TESTRAIL_PASSWORD }}
          TESTRAIL_PROJECT_ID: ${{ secrets.TESTRAIL_PROJECT_ID }}
          
      - name: Update test management systems
        if: always()
        run: npm run test-mgmt:update-from-cucumber
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    environment {
        JIRA_BASE_URL = credentials('jira-base-url')
        JIRA_USERNAME = credentials('jira-username')
        JIRA_API_TOKEN = credentials('jira-api-token')
        JIRA_PROJECT_KEY = credentials('jira-project-key')
        TESTRAIL_BASE_URL = credentials('testrail-base-url')
        TESTRAIL_USERNAME = credentials('testrail-username')
        TESTRAIL_PASSWORD = credentials('testrail-password')
        TESTRAIL_PROJECT_ID = credentials('testrail-project-id')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run test'
            }
            post {
                always {
                    sh 'npm run test-mgmt:update-from-cucumber'
                }
            }
        }
    }
}
```

## 📊 Advanced Features

### Test Case Synchronization
```typescript
// Sync test cases from Jira to TestRail
const syncResult = await testMgmt.syncTestCases('TEST', 1);
console.log(`Synchronized ${syncResult.synchronized} test cases`);
```

### Custom Test Result Processing
```typescript
// Convert Playwright test results to unified format
const convertPlaywrightResults = (playwrightResults) => {
    return playwrightResults.map(result => ({
        testKey: result.title.replace(/\s+/g, '-').toUpperCase(),
        title: result.title,
        status: result.status === 'passed' ? 'PASS' : 
                result.status === 'failed' ? 'FAIL' : 'SKIP',
        executionTime: result.duration,
        errorMessage: result.error?.message,
        executedBy: 'playwright-automation',
        executionDate: new Date().toISOString(),
        attachments: result.attachments?.map(a => a.path)
    }));
};
```

### Bulk Operations
```typescript
// Create multiple test cases
const testCases = [
    { title: 'Login test', description: 'Test user login' },
    { title: 'Logout test', description: 'Test user logout' },
    { title: 'Profile test', description: 'Test user profile' }
];

for (const testCase of testCases) {
    await jira.createTestIssue(
        testCase.title,
        testCase.description,
        [], // steps
        'Medium'
    );
}
```

### Report Generation
```typescript
// Generate comprehensive execution report
const executionSummary = testMgmt.generateExecutionSummary(
    testResults,
    'automation-bot',
    'production',
    '2.1.0',
    'BUILD-456'
);

const reportJson = await testMgmt.generateTestReport(
    testResults,
    executionSummary,
    './reports/test-management-report.json'
);
```

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Test connection first
npm run jira:test-connection
npm run testrail:test-connection

# Check configuration
cat src/config/jira-config.json
cat src/config/testrail-config.json
```

#### API Rate Limiting
```typescript
// Add delays between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

for (const result of testResults) {
    await jira.updateTestResult(result);
    await delay(1000); // 1 second delay
}
```

#### Test Case Mapping Issues
```typescript
// Create mapping from feature files
const mapping = await testRail.createTestCaseMappingFromFeatures(
    './features',
    1 // section ID
);
console.log('Test case mapping:', mapping);
```

### Error Handling
```typescript
try {
    await testMgmt.createTestExecution(/* parameters */);
} catch (error) {
    console.error('Test management error:', error.message);
    
    // Fallback to local reporting
    await generateLocalReport(testResults);
}
```

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'test-management:*';

// Or use console logging
const jira = new JiraIntegration();
jira.client.interceptors.request.use(config => {
    console.log('API Request:', config.method, config.url);
    return config;
});
```

## 📈 Best Practices

### 1. Test Case Management
- Use consistent naming conventions
- Link test cases to requirements/user stories
- Maintain test case documentation
- Regular cleanup of obsolete test cases

### 2. Execution Tracking
- Create executions for each build/release
- Use meaningful execution names and descriptions
- Tag executions with environment and version info
- Close completed test runs promptly

### 3. Result Reporting
- Include detailed error messages and logs
- Attach screenshots for UI test failures
- Use consistent status mapping
- Provide execution time metrics

### 4. Integration Workflow
- Automate test case creation from feature files
- Update results immediately after test execution
- Generate comprehensive reports for stakeholders
- Maintain traceability between requirements and tests

### 5. Configuration Management
- Use environment variables for sensitive data
- Maintain separate configs for different environments
- Version control configuration templates
- Document configuration changes

## 🔐 Security Considerations

### API Credentials
- Use API tokens instead of passwords where possible
- Store credentials in secure environment variables
- Rotate API tokens regularly
- Limit API user permissions to minimum required

### Data Protection
- Encrypt sensitive test data
- Avoid logging credentials or sensitive information
- Use HTTPS for all API communications
- Implement proper error handling to avoid data leaks

### Access Control
- Create dedicated service accounts for automation
- Use least-privilege principle for API users
- Monitor API usage and detect anomalies
- Implement rate limiting and retry logic

## 📚 Additional Resources

### Jira/Xray Documentation
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v2/)
- [Xray REST API](https://docs.getxray.app/display/XRAY/REST+API)
- [Zephyr for Jira API](https://zephyrdocs.atlassian.net/wiki/spaces/ZTD/pages/195330049/Zephyr+for+Jira+Cloud+REST+API)

### TestRail Documentation
- [TestRail API](https://www.gurock.com/testrail/docs/api)
- [TestRail Integration Guide](https://www.gurock.com/testrail/docs/integrations)

### Integration Examples
- [Cucumber to TestRail](https://github.com/cucumber/cucumber-js/wiki/TestRail-Integration)
- [Playwright to Jira](https://playwright.dev/docs/test-reporters#jira-reporter)

This comprehensive test management integration provides a robust foundation for connecting your Playwright Cucumber tests with popular test management platforms, enabling better traceability, reporting, and test governance.