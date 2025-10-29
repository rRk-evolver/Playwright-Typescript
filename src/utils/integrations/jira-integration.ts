import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';


/**
 * Utility function to extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getErrorMessage(error);
  }
  return String(error);
}

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
  testExecutionIssueType: string;
  testIssueType: string;
}

export interface JiraTestResult {
  testKey: string;
  status: "PASS" | "FAIL" | "SKIP";
  executionTime: number;
  errorMessage?: string;
  attachments?: string[];
  executedBy: string;
  executionDate: string;
  comment?: string;
}

export interface JiraTestExecution {
  key: string;
  summary: string;
  description: string;
  testResults: JiraTestResult[];
  projectKey: string;
  version?: string;
  environment?: string;
  assignee?: string;
}

export interface JiraIssue {
  key: string;
  id: string;
  summary: string;
  description?: string;
  status: string;
  assignee?: string;
  reporter?: string;
  created: string;
  updated: string;
  testSteps?: JiraTestStep[];
}

export interface JiraTestStep {
  step: string;
  data?: string;
  result?: string;
}

/**
 * Jira Integration utility for test management
 * Supports Xray and Zephyr plugins for test management
 */
export class JiraIntegration {
  private client: AxiosInstance;
  private config!: JiraConfig;
  private configPath: string;

  constructor(config?: JiraConfig) {
    this.configPath = resolve(__dirname, "../../config/jira-config.json");

    if (config) {
      this.config = config;
    } else {
      this.loadConfig();
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      auth: {
        username: this.config.username,
        password: this.config.apiToken,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
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
          baseUrl: process.env.JIRA_BASE_URL || "",
          username: process.env.JIRA_USERNAME || "",
          apiToken: process.env.JIRA_API_TOKEN || "",
          projectKey: process.env.JIRA_PROJECT_KEY || "TEST",
          testExecutionIssueType:
            process.env.JIRA_TEST_EXECUTION_TYPE || "Test Execution",
          testIssueType: process.env.JIRA_TEST_ISSUE_TYPE || "Test",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? getErrorMessage(error) : "Unknown error";
      throw new Error(`Failed to load Jira configuration: ${errorMessage}`);
    }
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `Jira API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("Jira API Request Error:", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `Jira API Response: ${response.status} ${response.statusText}`
        );
        return response;
      },
      (error) => {
        console.error(
          "Jira API Response Error:",
          error.response?.data || getErrorMessage(error)
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/rest/api/2/myself");
      console.log(`Connected to Jira as: ${response.data.displayName}`);
      return true;
    } catch (error) {
      console.error("Failed to connect to Jira:", getErrorMessage(error));
      return false;
    }
  }

  /**
   * Create a test issue in Jira
   */
  async createTestIssue(
    summary: string,
    description: string,
    testSteps: JiraTestStep[],
    priority = "Medium"
  ): Promise<JiraIssue> {
    try {
      const issueData = {
        fields: {
          project: { key: this.config.projectKey },
          summary: summary,
          description: description,
          issuetype: { name: this.config.testIssueType },
          priority: { name: priority },
          customfield_10000: testSteps.map((step, index) => ({
            index: index + 1,
            step: step.step,
            data: step.data || "",
            result: step.result || "",
          })),
        },
      };

      const response: AxiosResponse = await this.client.post(
        "/rest/api/2/issue",
        issueData
      );

      return {
        key: response.data.key,
        id: response.data.id,
        summary: summary,
        description: description,
        status: "To Do",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        testSteps: testSteps,
      };
    } catch (error) {
      throw new Error(`Failed to create test issue: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a test execution in Jira
   */
  async createTestExecution(executionData: JiraTestExecution): Promise<string> {
    try {
      const issueData = {
        fields: {
          project: { key: executionData.projectKey },
          summary: executionData.summary,
          description: executionData.description,
          issuetype: { name: this.config.testExecutionIssueType },
          assignee: executionData.assignee
            ? { name: executionData.assignee }
            : null,
          fixVersions: executionData.version
            ? [{ name: executionData.version }]
            : [],
          environment: executionData.environment || "Test Environment",
        },
      };

      const response: AxiosResponse = await this.client.post(
        "/rest/api/2/issue",
        issueData
      );
      const executionKey = response.data.key;

      // Link test cases to execution
      await this.linkTestsToExecution(executionKey, executionData.testResults);

      return executionKey;
    } catch (error) {
      throw new Error(
        `Failed to create test execution: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Update test results in Jira (Xray format)
   */
  async updateTestResults(testResults: JiraTestResult[]): Promise<void> {
    try {
      for (const result of testResults) {
        await this.updateSingleTestResult(result);
      }
    } catch (error) {
      throw new Error(
        `Failed to update test results: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Update a single test result
   */
  private async updateSingleTestResult(result: JiraTestResult): Promise<void> {
    try {
      // Get test issue
      const testIssue = await this.getIssue(result.testKey);

      // Create execution result
      const executionData = {
        status: result.status,
        executionTime: result.executionTime,
        executedBy: result.executedBy,
        executionDate: result.executionDate,
        comment: result.comment || "",
        defects:
          result.status === "FAIL" ? await this.createDefect(result) : [],
      };

      // Update via Xray API if available
      if (await this.isXrayAvailable()) {
        await this.updateXrayTestResult(result.testKey, executionData);
      } else {
        // Fallback to adding comment
        await this.addComment(result.testKey, this.formatResultComment(result));
      }

      // Upload attachments if any
      if (result.attachments && result.attachments.length > 0) {
        await this.uploadAttachments(result.testKey, result.attachments);
      }
    } catch (error) {
      console.error(
        `Failed to update test result for ${result.testKey}:`,
        getErrorMessage(error)
      );
    }
  }

  /**
   * Check if Xray plugin is available
   */
  private async isXrayAvailable(): Promise<boolean> {
    try {
      await this.client.get("/rest/raven/1.0/api/settings");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update test result via Xray API
   */
  private async updateXrayTestResult(
    testKey: string,
    executionData: any
  ): Promise<void> {
    try {
      const xrayData = {
        testKey: testKey,
        status: executionData.status,
        executedBy: executionData.executedBy,
        executionDate: executionData.executionDate,
        comment: executionData.comment,
        actualResult: executionData.comment,
        executionTime: executionData.executionTime,
      };

      await this.client.post("/rest/raven/1.0/api/testexec", xrayData);
    } catch (error) {
      throw new Error(
        `Failed to update Xray test result: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Create a defect for failed test
   */
  private async createDefect(result: JiraTestResult): Promise<string[]> {
    try {
      if (result.status === "PASS") return [];

      const defectData = {
        fields: {
          project: { key: this.config.projectKey },
          summary: `Test failure: ${result.testKey}`,
          description: `Test case ${result.testKey} failed.\n\nError message:\n${result.errorMessage || "No error message provided"}`,
          issuetype: { name: "Bug" },
          priority: { name: "High" },
        },
      };

      const response = await this.client.post("/rest/api/2/issue", defectData);

      // Link defect to test
      await this.linkIssues(result.testKey, response.data.key, "is tested by");

      return [response.data.key];
    } catch (error) {
      console.error("Failed to create defect:", getErrorMessage(error));
      return [];
    }
  }

  /**
   * Link test cases to test execution
   */
  private async linkTestsToExecution(
    executionKey: string,
    testResults: JiraTestResult[]
  ): Promise<void> {
    try {
      for (const result of testResults) {
        await this.linkIssues(executionKey, result.testKey, "tests");
      }
    } catch (error) {
      console.error(
        "Failed to link tests to execution:",
        getErrorMessage(error)
      );
    }
  }

  /**
   * Link two issues with specified relationship
   */
  private async linkIssues(
    inwardIssue: string,
    outwardIssue: string,
    linkType: string
  ): Promise<void> {
    try {
      const linkData = {
        type: { name: linkType },
        inwardIssue: { key: inwardIssue },
        outwardIssue: { key: outwardIssue },
      };

      await this.client.post("/rest/api/2/issueLink", linkData);
    } catch (error) {
      console.error(
        `Failed to link issues ${inwardIssue} -> ${outwardIssue}:`,
        getErrorMessage(error)
      );
    }
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/rest/api/2/issue/${issueKey}`);
      const issue = response.data;

      return {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        created: issue.fields.created,
        updated: issue.fields.updated,
      };
    } catch (error) {
      throw new Error(
        `Failed to get issue ${issueKey}: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      const commentData = {
        body: comment,
      };

      await this.client.post(
        `/rest/api/2/issue/${issueKey}/comment`,
        commentData
      );
    } catch (error) {
      console.error(
        `Failed to add comment to ${issueKey}:`,
        getErrorMessage(error)
      );
    }
  }

  /**
   * Upload attachments to issue
   */
  async uploadAttachments(
    issueKey: string,
    attachmentPaths: string[]
  ): Promise<void> {
    try {
      const FormData = require("form-data");

      for (const path of attachmentPaths) {
        if (existsSync(path)) {
          const form = new FormData();
          form.append("file", readFileSync(path), {
            filename: path.split("/").pop(),
            contentType: "application/octet-stream",
          });

          await this.client.post(
            `/rest/api/2/issue/${issueKey}/attachments`,
            form,
            {
              headers: {
                ...form.getHeaders(),
                "X-Atlassian-Token": "no-check",
              },
            }
          );
        }
      }
    } catch (error) {
      console.error(
        `Failed to upload attachments to ${issueKey}:`,
        getErrorMessage(error)
      );
    }
  }

  /**
   * Format test result as comment
   */
  private formatResultComment(result: JiraTestResult): string {
    const status =
      result.status === "PASS"
        ? "✅ PASSED"
        : result.status === "FAIL"
          ? "❌ FAILED"
          : "⏭️ SKIPPED";

    return `
*Test Execution Result*

*Status:* ${status}
*Executed By:* ${result.executedBy}
*Execution Date:* ${result.executionDate}
*Execution Time:* ${result.executionTime}ms

${result.errorMessage ? `*Error:* {code}${result.errorMessage}{code}` : ""}
${result.comment ? `*Notes:* ${result.comment}` : ""}
        `.trim();
  }

  /**
   * Search issues with JQL
   */
  async searchIssues(
    jql: string,
    fields: string[] = ["key", "summary", "status"]
  ): Promise<JiraIssue[]> {
    try {
      const response = await this.client.post("/rest/api/2/search", {
        jql: jql,
        fields: fields,
        maxResults: 100,
      });

      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
      }));
    } catch (error) {
      throw new Error(`Failed to search issues: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get test cases for a project
   */
  async getTestCases(projectKey?: string): Promise<JiraIssue[]> {
    const project = projectKey || this.config.projectKey;
    const jql = `project = "${project}" AND issuetype = "${this.config.testIssueType}" ORDER BY created DESC`;

    return await this.searchIssues(jql);
  }

  /**
   * Generate test execution report
   */
  async generateExecutionReport(executionKey: string): Promise<any> {
    try {
      const execution = await this.getIssue(executionKey);
      const linkedTests = await this.getLinkedTests(executionKey);

      const report = {
        executionKey: executionKey,
        summary: execution.summary,
        status: execution.status,
        totalTests: linkedTests.length,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        executionDate: execution.updated,
        testResults: linkedTests,
      };

      // Calculate statistics (this would need to be enhanced based on actual test results)
      linkedTests.forEach((test) => {
        // This is a simplified example - actual implementation would check test execution results
        if (test.status === "Done") report.passedTests++;
        else if (test.status === "Failed") report.failedTests++;
        else report.skippedTests++;
      });

      return report;
    } catch (error) {
      throw new Error(
        `Failed to generate execution report: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get tests linked to execution
   */
  private async getLinkedTests(executionKey: string): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get(
        `/rest/api/2/issue/${executionKey}?expand=issuelinks`
      );
      const links = response.data.fields.issuelinks || [];

      const testKeys = links
        .filter((link: any) => link.type.name === "tests")
        .map((link: any) => link.outwardIssue?.key || link.inwardIssue?.key)
        .filter(Boolean);

      const tests = [];
      for (const key of testKeys) {
        try {
          const test = await this.getIssue(key);
          tests.push(test);
        } catch (error) {
          console.error(
            `Failed to get linked test ${key}:`,
            getErrorMessage(error)
          );
        }
      }

      return tests;
    } catch (error) {
      throw new Error(`Failed to get linked tests: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Export configuration to file
   */
  exportConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(`Jira configuration exported to: ${this.configPath}`);
    } catch (error) {
      console.error("Failed to export configuration:", getErrorMessage(error));
    }
  }
}
