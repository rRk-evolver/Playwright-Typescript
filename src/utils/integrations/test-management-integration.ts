import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { JiraIntegration, JiraTestExecution, JiraTestResult } from './jira-integration';
import { TestRailIntegration, TestRailResult } from './testrail-integration';


/**
 * Utility function to extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export interface TestManagementConfig {
  jira?: {
    enabled: boolean;
    config?: any;
  };
  testrail?: {
    enabled: boolean;
    config?: any;
  };
  defaultTool?: "jira" | "testrail" | "both";
}

export interface UnifiedTestResult {
  testKey: string;
  testId?: number;
  title: string;
  status: "PASS" | "FAIL" | "SKIP";
  executionTime: number;
  errorMessage?: string;
  attachments?: string[];
  executedBy: string;
  executionDate: string;
  comment?: string;
  version?: string;
  environment?: string;
}

export interface TestExecutionSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  passRate: number;
  environment: string;
  version?: string;
  buildNumber?: string;
  executedBy: string;
  executionDate: string;
}

/**
 * Unified Test Management Integration
 * Supports both Jira and TestRail integrations
 */
export class TestManagementIntegration {
  private jiraIntegration?: JiraIntegration;
  private testRailIntegration?: TestRailIntegration;
  private config!: TestManagementConfig;
  private configPath: string;

  constructor(config?: TestManagementConfig) {
    this.configPath = resolve(
      __dirname,
      "../../config/test-management-config.json"
    );

    if (config) {
      this.config = config;
    } else {
      this.loadConfig();
    }

    this.initializeIntegrations();
  }

  /**
   * Load configuration from file or environment variables
   */
  private loadConfig(): void {
    try {
      if (existsSync(this.configPath)) {
        const configFile = readFileSync(this.configPath, "utf-8");
        this.config = JSON.parse(configFile);
      } else {
        // Load from environment variables
        this.config = {
          jira: {
            enabled: process.env.JIRA_ENABLED === "true",
            config: process.env.JIRA_ENABLED === "true" ? undefined : undefined,
          },
          testrail: {
            enabled: process.env.TESTRAIL_ENABLED === "true",
            config:
              process.env.TESTRAIL_ENABLED === "true" ? undefined : undefined,
          },
          defaultTool:
            (process.env.DEFAULT_TEST_TOOL as "jira" | "testrail" | "both") ||
            "jira",
        };
      }
    } catch (error) {
      console.warn(
        "Failed to load test management configuration, using defaults:",
        getErrorMessage(error)
      );
      this.config = {
        jira: { enabled: false },
        testrail: { enabled: false },
        defaultTool: "jira",
      };
    }
  }

  /**
   * Initialize integrations based on configuration
   */
  private initializeIntegrations(): void {
    try {
      if (this.config.jira?.enabled) {
        this.jiraIntegration = new JiraIntegration(this.config.jira.config);
      }

      if (this.config.testrail?.enabled) {
        this.testRailIntegration = new TestRailIntegration(
          this.config.testrail.config
        );
      }
    } catch (error) {
      console.error(
        "Failed to initialize test management integrations:",
        getErrorMessage(error)
      );
    }
  }

  /**
   * Test connectivity to enabled test management tools
   */
  async testConnections(): Promise<{ jira?: boolean; testrail?: boolean }> {
    const results: { jira?: boolean; testrail?: boolean } = {};

    if (this.jiraIntegration) {
      try {
        results.jira = await this.jiraIntegration.testConnection();
      } catch (error) {
        console.error("Jira connection test failed:", getErrorMessage(error));
        results.jira = false;
      }
    }

    if (this.testRailIntegration) {
      try {
        results.testrail = await this.testRailIntegration.testConnection();
      } catch (error) {
        console.error(
          "TestRail connection test failed:",
          getErrorMessage(error)
        );
        results.testrail = false;
      }
    }

    return results;
  }

  /**
   * Create test execution in enabled tools
   */
  async createTestExecution(
    name: string,
    description: string,
    testResults: UnifiedTestResult[],
    options: {
      environment?: string;
      version?: string;
      assignee?: string;
      milestoneId?: number;
    } = {}
  ): Promise<{ jira?: string; testrail?: number }> {
    const executionIds: { jira?: string; testrail?: number } = {};

    // Create Jira test execution
    if (this.jiraIntegration) {
      try {
        const jiraResults: JiraTestResult[] = testResults.map((result) => ({
          testKey: result.testKey,
          status: result.status,
          executionTime: result.executionTime,
          errorMessage: result.errorMessage,
          attachments: result.attachments,
          executedBy: result.executedBy,
          executionDate: result.executionDate,
          comment: result.comment,
        }));

        const jiraExecution: JiraTestExecution = {
          key: "",
          summary: name,
          description: description,
          testResults: jiraResults,
          projectKey: this.jiraIntegration["config"].projectKey,
          version: options.version,
          environment: options.environment,
          assignee: options.assignee,
        };

        executionIds.jira =
          await this.jiraIntegration.createTestExecution(jiraExecution);
      } catch (error) {
        console.error(
          "Failed to create Jira test execution:",
          getErrorMessage(error)
        );
      }
    }

    // Create TestRail test run
    if (this.testRailIntegration) {
      try {
        const testCaseIds = testResults
          .filter((r) => r.testId)
          .map((r) => r.testId as number);

        const run = await this.testRailIntegration.createTestRun(
          name,
          description,
          undefined, // suiteId
          testCaseIds,
          options.milestoneId
        );

        executionIds.testrail = run.id;

        // Add test results to the run
        const testRailResults: TestRailResult[] = testResults
          .filter((r) => r.testId)
          .map((result) => ({
            test_id: result.testId!,
            status_id: this.testRailIntegration!.getStatusForResult(
              result.status === "PASS"
                ? "passed"
                : result.status === "FAIL"
                  ? "failed"
                  : "skipped"
            ),
            comment:
              result.comment ||
              `${result.title}\nStatus: ${result.status}\nDuration: ${result.executionTime}ms`,
            elapsed: `${Math.ceil(result.executionTime / 1000)}s`,
            version: options.version,
          }));

        if (testRailResults.length > 0) {
          await this.testRailIntegration.addTestResults(
            run.id,
            testRailResults
          );
        }
      } catch (error) {
        console.error(
          "Failed to create TestRail test run:",
          getErrorMessage(error)
        );
      }
    }

    return executionIds;
  }

  /**
   * Update test results from Cucumber JSON report
   */
  async updateResultsFromCucumberReport(
    cucumberJsonPath: string,
    options: {
      jiraExecutionKey?: string;
      testRailRunId?: number;
      testCaseMapping?: {
        [scenarioName: string]: { jiraKey?: string; testRailId?: number };
      };
      version?: string;
      environment?: string;
      executedBy?: string;
    } = {}
  ): Promise<void> {
    try {
      if (!existsSync(cucumberJsonPath)) {
        throw new Error(`Cucumber JSON report not found: ${cucumberJsonPath}`);
      }

      const reportData = JSON.parse(readFileSync(cucumberJsonPath, "utf-8"));
      const testResults: UnifiedTestResult[] = [];

      // Parse Cucumber report
      for (const feature of reportData) {
        for (const element of feature.elements) {
          if (element.type === "scenario") {
            const executionTime =
              element.steps?.reduce((total: number, step: any) => {
                return total + (step.result?.duration || 0);
              }, 0) || 0;

            const status =
              element.result?.status === "passed"
                ? "PASS"
                : element.result?.status === "failed"
                  ? "FAIL"
                  : "SKIP";

            const mapping = options.testCaseMapping?.[element.name];

            const result: UnifiedTestResult = {
              testKey: mapping?.jiraKey || element.name,
              testId: mapping?.testRailId,
              title: element.name,
              status: status,
              executionTime: executionTime / 1000000, // Convert nanoseconds to milliseconds
              errorMessage: element.result?.error_message,
              executedBy: options.executedBy || "Automated Test",
              executionDate: new Date().toISOString(),
              comment: this.generateTestComment(element),
              version: options.version,
              environment: options.environment,
            };

            testResults.push(result);
          }
        }
      }

      // Update Jira if enabled and execution key provided
      if (
        this.jiraIntegration &&
        options.jiraExecutionKey &&
        testResults.length > 0
      ) {
        const jiraResults: JiraTestResult[] = testResults.map((result) => ({
          testKey: result.testKey,
          status: result.status,
          executionTime: result.executionTime,
          errorMessage: result.errorMessage,
          executedBy: result.executedBy,
          executionDate: result.executionDate,
          comment: result.comment,
        }));

        await this.jiraIntegration.updateTestResults(jiraResults);
      }

      // Update TestRail if enabled and run ID provided
      if (
        this.testRailIntegration &&
        options.testRailRunId &&
        testResults.length > 0
      ) {
        const testRailResults: TestRailResult[] = testResults
          .filter((result) => result.testId)
          .map((result) => ({
            test_id: result.testId!,
            status_id: this.testRailIntegration!.getStatusForResult(
              result.status === "PASS"
                ? "passed"
                : result.status === "FAIL"
                  ? "failed"
                  : "skipped"
            ),
            comment: result.comment || result.title,
            elapsed: `${Math.ceil(result.executionTime / 1000)}s`,
            version: result.version,
          }));

        if (testRailResults.length > 0) {
          await this.testRailIntegration.addTestResults(
            options.testRailRunId,
            testRailResults
          );
        }
      }

      console.log(
        `Updated ${testResults.length} test results in test management tools`
      );
    } catch (error) {
      throw new Error(
        `Failed to update results from Cucumber report: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Generate execution summary from test results
   */
  generateExecutionSummary(
    testResults: UnifiedTestResult[],
    executedBy: string,
    environment: string,
    version?: string,
    buildNumber?: string
  ): TestExecutionSummary {
    const totalTests = testResults.length;
    const passedTests = testResults.filter((r) => r.status === "PASS").length;
    const failedTests = testResults.filter((r) => r.status === "FAIL").length;
    const skippedTests = testResults.filter((r) => r.status === "SKIP").length;
    const totalExecutionTime = testResults.reduce(
      (total, r) => total + r.executionTime,
      0
    );
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      executionTime: totalExecutionTime,
      passRate: Math.round(passRate * 100) / 100,
      environment,
      version,
      buildNumber,
      executedBy,
      executionDate: new Date().toISOString(),
    };
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(
    testResults: UnifiedTestResult[],
    executionSummary: TestExecutionSummary,
    outputPath?: string
  ): Promise<string> {
    try {
      const report = {
        title: "Test Execution Report",
        generatedAt: new Date().toISOString(),
        summary: executionSummary,
        results: testResults.map((result) => ({
          testKey: result.testKey,
          testId: result.testId,
          title: result.title,
          status: result.status,
          executionTime: `${result.executionTime}ms`,
          executedBy: result.executedBy,
          comment: result.comment,
          errorMessage: result.errorMessage,
        })),
        statistics: {
          passRate: `${executionSummary.passRate}%`,
          totalExecutionTime: `${Math.round(executionSummary.executionTime / 1000)}s`,
          averageExecutionTime: `${Math.round(executionSummary.executionTime / executionSummary.totalTests)}ms`,
        },
      };

      const reportJson = JSON.stringify(report, null, 2);

      if (outputPath) {
        const fs = require("fs");
        const path = require("path");

        // Ensure directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, reportJson);
        console.log(`Test report generated: ${outputPath}`);
      }

      return reportJson;
    } catch (error) {
      throw new Error(
        `Failed to generate test report: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Generate comment for test result
   */
  private generateTestComment(element: any): string {
    let comment = `Scenario: ${element.name}\n`;
    comment += `Status: ${element.result?.status || "unknown"}\n`;

    if (element.steps && element.steps.length > 0) {
      comment += "\nSteps:\n";
      element.steps.forEach((step: any, index: number) => {
        const stepStatus = step.result?.status || "unknown";
        const emoji =
          stepStatus === "passed"
            ? "✅"
            : stepStatus === "failed"
              ? "❌"
              : "⏭️";
        comment += `${index + 1}. ${emoji} ${step.name}\n`;
      });
    }

    if (element.result?.error_message) {
      comment += `\nError Details:\n${element.result.error_message}`;
    }

    return comment;
  }

  /**
   * Sync test cases between Jira and TestRail
   */
  async syncTestCases(
    jiraProjectKey?: string,
    testRailSectionId?: number
  ): Promise<{ synchronized: number; errors: string[] }> {
    const errors: string[] = [];
    let synchronized = 0;

    try {
      if (!this.jiraIntegration || !this.testRailIntegration) {
        throw new Error(
          "Both Jira and TestRail integrations must be enabled for synchronization"
        );
      }

      // Get test cases from Jira
      const jiraTestCases =
        await this.jiraIntegration.getTestCases(jiraProjectKey);

      // Get existing TestRail cases
      const testRailCases = await this.testRailIntegration.getTestCases();
      const testRailCasesByTitle = new Map(
        testRailCases.map((c) => [c.title, c])
      );

      for (const jiraCase of jiraTestCases) {
        try {
          const existingTestRailCase = testRailCasesByTitle.get(
            jiraCase.summary
          );

          if (!existingTestRailCase && testRailSectionId) {
            // Create new TestRail case
            await this.testRailIntegration.createTestCase(
              testRailSectionId,
              jiraCase.summary,
              TestRailIntegration.CASE_TYPE.AUTOMATED,
              TestRailIntegration.PRIORITY.MEDIUM,
              {
                expected: "Test should pass successfully",
                refs: jiraCase.key,
              }
            );
            synchronized++;
          }
        } catch (error) {
          errors.push(
            `Failed to sync case ${jiraCase.key}: ${getErrorMessage(error)}`
          );
        }
      }

      return { synchronized, errors };
    } catch (error) {
      throw new Error(`Failed to sync test cases: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get enabled integrations
   */
  getEnabledIntegrations(): string[] {
    const enabled: string[] = [];
    if (this.jiraIntegration) enabled.push("Jira");
    if (this.testRailIntegration) enabled.push("TestRail");
    return enabled;
  }

  /**
   * Export configuration
   */
  exportConfig(): void {
    try {
      const fs = require("fs");
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(
        `Test management configuration exported to: ${this.configPath}`
      );
    } catch (error) {
      console.error("Failed to export configuration:", getErrorMessage(error));
    }
  }
}
