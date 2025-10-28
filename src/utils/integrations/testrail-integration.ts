import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Utility function to extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

export interface TestRailConfig {
    baseUrl: string;
    username: string;
    password: string;
    projectId: number;
}

export interface TestRailCase {
    id: number;
    title: string;
    section_id: number;
    type_id: number;
    priority_id: number;
    custom_steps?: TestRailStep[];
    custom_expected?: string;
    custom_preconds?: string;
    estimate?: string;
    refs?: string;
}

export interface TestRailStep {
    content: string;
    expected: string;
}

export interface TestRailRun {
    id: number;
    name: string;
    description?: string;
    milestone_id?: number;
    assignedto_id?: number;
    include_all: boolean;
    case_ids?: number[];
    config_ids?: number[];
}

export interface TestRailResult {
    test_id: number;
    status_id: number;
    comment?: string;
    elapsed?: string;
    defects?: string;
    version?: string;
    assignedto_id?: number;
    custom_step_results?: TestRailStepResult[];
    attachments?: string[];
}

export interface TestRailStepResult {
    content: string;
    expected: string;
    actual: string;
    status_id: number;
}

export interface TestRailProject {
    id: number;
    name: string;
    announcement?: string;
    show_announcement: boolean;
    is_completed: boolean;
    completed_on?: number;
    suite_mode: number;
    url: string;
}

export interface TestRailMilestone {
    id: number;
    name: string;
    description?: string;
    start_on?: number;
    started_on?: number;
    due_on?: number;
    completed_on?: number;
    is_completed: boolean;
    is_started: boolean;
    project_id: number;
    parent_id?: number;
    url: string;
}

/**
 * TestRail Integration utility for test management
 */
export class TestRailIntegration {
    private client: AxiosInstance;
    private config!: TestRailConfig;
    private configPath: string;

    // TestRail status constants
    public static readonly STATUS = {
        PASSED: 1,
        BLOCKED: 2,
        UNTESTED: 3,
        RETEST: 4,
        FAILED: 5,
        SKIPPED: 6
    };

    // TestRail priority constants
    public static readonly PRIORITY = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4
    };

    // TestRail case type constants
    public static readonly CASE_TYPE = {
        ACCEPTANCE: 1,
        ACCESSIBILITY: 2,
        AUTOMATED: 3,
        COMPATIBILITY: 4,
        DESTRUCTIVE: 5,
        FUNCTIONAL: 6,
        OTHER: 7,
        PERFORMANCE: 8,
        REGRESSION: 9,
        SECURITY: 10,
        SMOKE_SANITY: 11,
        USABILITY: 12
    };

    constructor(config?: TestRailConfig) {
        this.configPath = resolve(__dirname, '../../config/testrail-config.json');
        
        if (config) {
            this.config = config;
        } else {
            this.loadConfig();
        }

        this.client = axios.create({
            baseURL: `${this.config.baseUrl}/index.php?/api/v2`,
            auth: {
                username: this.config.username,
                password: this.config.password
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        this.setupInterceptors();
    }

    /**
     * Load configuration from file or environment variables
     */
    private loadConfig(): void {
        try {
            if (existsSync(this.configPath)) {
                const configFile = readFileSync(this.configPath, 'utf-8');
                this.config = JSON.parse(configFile);
            } else {
                // Load from environment variables
                this.config = {
                    baseUrl: process.env.TESTRAIL_BASE_URL || '',
                    username: process.env.TESTRAIL_USERNAME || '',
                    password: process.env.TESTRAIL_PASSWORD || '',
                    projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1', 10)
                };
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            throw new Error(`Failed to load TestRail configuration: ${errorMessage}`);
        }
    }

    /**
     * Setup axios interceptors for logging and error handling
     */
    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            (config) => {
                console.log(`TestRail API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('TestRail API Request Error:', getErrorMessage(error));
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                console.log(`TestRail API Response: ${response.status} ${response.statusText}`);
                return response;
            },
            (error) => {
                console.error('TestRail API Response Error:', error.response?.data || getErrorMessage(error));
                return Promise.reject(error);
            }
        );
    }

    /**
     * Test connection to TestRail
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/get_user_by_email&email=' + this.config.username);
            console.log(`Connected to TestRail as: ${response.data.name}`);
            return true;
        } catch (error) {
            console.error('Failed to connect to TestRail:', getErrorMessage(error));
            return false;
        }
    }

    /**
     * Get project information
     */
    async getProject(projectId?: number): Promise<TestRailProject> {
        try {
            const id = projectId || this.config.projectId;
            const response = await this.client.get(`/get_project/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get project: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get all projects
     */
    async getProjects(): Promise<TestRailProject[]> {
        try {
            const response = await this.client.get('/get_projects');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get projects: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Create a test case
     */
    async createTestCase(
        sectionId: number,
        title: string,
        typeId: number = TestRailIntegration.CASE_TYPE.AUTOMATED,
        priorityId: number = TestRailIntegration.PRIORITY.MEDIUM,
        template?: {
            steps?: TestRailStep[];
            expected?: string;
            preconditions?: string;
            estimate?: string;
            refs?: string;
        }
    ): Promise<TestRailCase> {
        try {
            const caseData: any = {
                title: title,
                type_id: typeId,
                priority_id: priorityId
            };

            if (template) {
                if (template.steps) {
                    caseData.custom_steps_separated = template.steps.map((step, index) => ({
                        content: step.content,
                        expected: step.expected
                    }));
                }
                if (template.expected) caseData.custom_expected = template.expected;
                if (template.preconditions) caseData.custom_preconds = template.preconditions;
                if (template.estimate) caseData.estimate = template.estimate;
                if (template.refs) caseData.refs = template.refs;
            }

            const response = await this.client.post(`/add_case/${sectionId}`, caseData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create test case: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Update a test case
     */
    async updateTestCase(caseId: number, updates: Partial<TestRailCase>): Promise<TestRailCase> {
        try {
            const response = await this.client.post(`/update_case/${caseId}`, updates);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to update test case: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get test case by ID
     */
    async getTestCase(caseId: number): Promise<TestRailCase> {
        try {
            const response = await this.client.get(`/get_case/${caseId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get test case: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get test cases for a project/suite
     */
    async getTestCases(suiteId?: number, sectionId?: number): Promise<TestRailCase[]> {
        try {
            let url = `/get_cases/${this.config.projectId}`;
            const params = new URLSearchParams();
            
            if (suiteId) params.append('suite_id', suiteId.toString());
            if (sectionId) params.append('section_id', sectionId.toString());
            
            if (params.toString()) {
                url += `&${params.toString()}`;
            }

            const response = await this.client.get(url);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get test cases: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Create a test run
     */
    async createTestRun(
        name: string,
        description?: string,
        suiteId?: number,
        caseIds?: number[],
        milestoneId?: number,
        assignedToId?: number
    ): Promise<TestRailRun> {
        try {
            const runData: any = {
                name: name,
                description: description || '',
                include_all: !caseIds || caseIds.length === 0
            };

            if (suiteId) runData.suite_id = suiteId;
            if (caseIds && caseIds.length > 0) {
                runData.case_ids = caseIds;
                runData.include_all = false;
            }
            if (milestoneId) runData.milestone_id = milestoneId;
            if (assignedToId) runData.assignedto_id = assignedToId;

            const response = await this.client.post(`/add_run/${this.config.projectId}`, runData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create test run: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get test run by ID
     */
    async getTestRun(runId: number): Promise<TestRailRun> {
        try {
            const response = await this.client.get(`/get_run/${runId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get test run: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get all test runs for a project
     */
    async getTestRuns(
        projectId?: number,
        isCompleted?: boolean,
        limit?: number,
        offset?: number
    ): Promise<TestRailRun[]> {
        try {
            const id = projectId || this.config.projectId;
            let url = `/get_runs/${id}`;
            const params = new URLSearchParams();

            if (isCompleted !== undefined) params.append('is_completed', isCompleted ? '1' : '0');
            if (limit) params.append('limit', limit.toString());
            if (offset) params.append('offset', offset.toString());

            if (params.toString()) {
                url += `&${params.toString()}`;
            }

            const response = await this.client.get(url);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get test runs: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Close a test run
     */
    async closeTestRun(runId: number): Promise<TestRailRun> {
        try {
            const response = await this.client.post(`/close_run/${runId}`, {});
            return response.data;
        } catch (error) {
            throw new Error(`Failed to close test run: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Add test result
     */
    async addTestResult(testId: number, result: TestRailResult): Promise<any> {
        try {
            const response = await this.client.post(`/add_result/${testId}`, result);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to add test result: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Add multiple test results
     */
    async addTestResults(runId: number, results: TestRailResult[]): Promise<any> {
        try {
            const payload = {
                results: results
            };
            const response = await this.client.post(`/add_results/${runId}`, payload);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to add test results: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get test results for a test run
     */
    async getTestResults(runId: number, limit?: number, offset?: number): Promise<any[]> {
        try {
            let url = `/get_results_for_run/${runId}`;
            const params = new URLSearchParams();

            if (limit) params.append('limit', limit.toString());
            if (offset) params.append('offset', offset.toString());

            if (params.toString()) {
                url += `&${params.toString()}`;
            }

            const response = await this.client.get(url);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get test results: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get test for run (individual test instances)
     */
    async getTestsForRun(runId: number): Promise<any[]> {
        try {
            const response = await this.client.get(`/get_tests/${runId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get tests for run: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Create milestone
     */
    async createMilestone(
        name: string,
        description?: string,
        dueOn?: Date,
        parentId?: number
    ): Promise<TestRailMilestone> {
        try {
            const milestoneData: any = {
                name: name,
                description: description || ''
            };

            if (dueOn) milestoneData.due_on = Math.floor(dueOn.getTime() / 1000);
            if (parentId) milestoneData.parent_id = parentId;

            const response = await this.client.post(`/add_milestone/${this.config.projectId}`, milestoneData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create milestone: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get milestones for project
     */
    async getMilestones(projectId?: number): Promise<TestRailMilestone[]> {
        try {
            const id = projectId || this.config.projectId;
            const response = await this.client.get(`/get_milestones/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get milestones: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Upload attachment to test result
     */
    async uploadAttachment(resultId: number, filePath: string): Promise<any> {
        try {
            if (!existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const FormData = require('form-data');
            const form = new FormData();
            form.append('attachment', readFileSync(filePath), {
                filename: filePath.split('/').pop(),
                contentType: 'application/octet-stream'
            });

            const response = await this.client.post(`/add_attachment_to_result/${resultId}`, form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to upload attachment: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get status mapping for Playwright results to TestRail
     */
    getStatusForResult(status: 'passed' | 'failed' | 'skipped' | 'timedout'): number {
        switch (status) {
            case 'passed':
                return TestRailIntegration.STATUS.PASSED;
            case 'failed':
            case 'timedout':
                return TestRailIntegration.STATUS.FAILED;
            case 'skipped':
                return TestRailIntegration.STATUS.SKIPPED;
            default:
                return TestRailIntegration.STATUS.UNTESTED;
        }
    }

    /**
     * Convert Cucumber test result to TestRail format
     */
    convertCucumberResult(
        testId: number,
        scenario: any,
        executionTime: number = 0,
        version?: string,
        assignedToId?: number
    ): TestRailResult {
        const status = scenario.result?.status;
        const statusId = this.getStatusForResult(status);
        
        let comment = `Scenario: ${scenario.name}\n`;
        comment += `Status: ${status}\n`;
        comment += `Duration: ${executionTime}ms\n`;
        
        if (scenario.result?.error_message) {
            comment += `\nError:\n${scenario.result.error_message}`;
        }

        if (scenario.steps && scenario.steps.length > 0) {
            comment += '\n\nSteps:\n';
            scenario.steps.forEach((step: any, index: number) => {
                comment += `${index + 1}. ${step.name} - ${step.result?.status || 'unknown'}\n`;
            });
        }

        const result: TestRailResult = {
            test_id: testId,
            status_id: statusId,
            comment: comment,
            elapsed: `${Math.ceil(executionTime / 1000)}s`
        };

        if (version) result.version = version;
        if (assignedToId) result.assignedto_id = assignedToId;

        return result;
    }

    /**
     * Bulk update test results from Cucumber JSON report
     */
    async updateResultsFromCucumberReport(
        runId: number,
        cucumberJsonPath: string,
        testCaseMapping: { [scenarioName: string]: number },
        version?: string,
        assignedToId?: number
    ): Promise<void> {
        try {
            if (!existsSync(cucumberJsonPath)) {
                throw new Error(`Cucumber JSON report not found: ${cucumberJsonPath}`);
            }

            const reportData = JSON.parse(readFileSync(cucumberJsonPath, 'utf-8'));
            const results: TestRailResult[] = [];

            for (const feature of reportData) {
                for (const element of feature.elements) {
                    if (element.type === 'scenario' && testCaseMapping[element.name]) {
                        const testId = testCaseMapping[element.name];
                        const executionTime = element.steps?.reduce((total: number, step: any) => {
                            return total + (step.result?.duration || 0);
                        }, 0) || 0;

                        const result = this.convertCucumberResult(
                            testId,
                            element,
                            executionTime / 1000000, // Convert nanoseconds to milliseconds
                            version,
                            assignedToId
                        );

                        results.push(result);
                    }
                }
            }

            if (results.length > 0) {
                await this.addTestResults(runId, results);
                console.log(`Updated ${results.length} test results in TestRail`);
            } else {
                console.log('No matching test cases found for update');
            }
        } catch (error) {
            throw new Error(`Failed to update results from Cucumber report: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Generate comprehensive test execution report
     */
    async generateExecutionReport(runId: number): Promise<any> {
        try {
            const run = await this.getTestRun(runId);
            const tests = await this.getTestsForRun(runId);
            const results = await this.getTestResults(runId);

            const report = {
                runId: runId,
                name: run.name,
                description: run.description,
                totalTests: tests.length,
                completedTests: results.length,
                passedTests: 0,
                failedTests: 0,
                blockedTests: 0,
                skippedTests: 0,
                untestedTests: 0,
                retestTests: 0,
                executionSummary: {
                    totalExecutionTime: 0,
                    averageExecutionTime: 0
                },
                testDetails: tests.map(test => {
                    const result = results.find(r => r.test_id === test.id);
                    return {
                        testId: test.id,
                        caseId: test.case_id,
                        title: test.title,
                        status: this.getStatusName(result?.status_id || TestRailIntegration.STATUS.UNTESTED),
                        executionTime: result?.elapsed || '0s',
                        comment: result?.comment || '',
                        assignee: result?.assignedto_id || test.assignedto_id
                    };
                })
            };

            // Calculate statistics
            results.forEach(result => {
                switch (result.status_id) {
                    case TestRailIntegration.STATUS.PASSED:
                        report.passedTests++;
                        break;
                    case TestRailIntegration.STATUS.FAILED:
                        report.failedTests++;
                        break;
                    case TestRailIntegration.STATUS.BLOCKED:
                        report.blockedTests++;
                        break;
                    case TestRailIntegration.STATUS.SKIPPED:
                        report.skippedTests++;
                        break;
                    case TestRailIntegration.STATUS.RETEST:
                        report.retestTests++;
                        break;
                    default:
                        report.untestedTests++;
                        break;
                }

                // Parse elapsed time for total calculation
                const elapsed = result.elapsed || '0s';
                const seconds = parseInt(elapsed.replace('s', '')) || 0;
                report.executionSummary.totalExecutionTime += seconds;
            });

            report.executionSummary.averageExecutionTime = 
                report.completedTests > 0 
                    ? Math.round(report.executionSummary.totalExecutionTime / report.completedTests)
                    : 0;

            return report;
        } catch (error) {
            throw new Error(`Failed to generate execution report: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Get human-readable status name
     */
    private getStatusName(statusId: number): string {
        const statusMap: { [key: number]: string } = {
            [TestRailIntegration.STATUS.PASSED]: 'Passed',
            [TestRailIntegration.STATUS.BLOCKED]: 'Blocked',
            [TestRailIntegration.STATUS.UNTESTED]: 'Untested',
            [TestRailIntegration.STATUS.RETEST]: 'Retest',
            [TestRailIntegration.STATUS.FAILED]: 'Failed',
            [TestRailIntegration.STATUS.SKIPPED]: 'Skipped'
        };
        return statusMap[statusId] || 'Unknown';
    }

    /**
     * Export configuration to file
     */
    exportConfig(): void {
        try {
            writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log(`TestRail configuration exported to: ${this.configPath}`);
        } catch (error) {
            console.error('Failed to export configuration:', getErrorMessage(error));
        }
    }

    /**
     * Create test case mapping from feature files
     */
    async createTestCaseMappingFromFeatures(featuresPath: string, sectionId: number): Promise<{ [scenarioName: string]: number }> {
        try {
            const glob = require('glob');
            const fs = require('fs');
            const mapping: { [scenarioName: string]: number } = {};

            const featureFiles = glob.sync(`${featuresPath}/**/*.feature`);

            for (const featureFile of featureFiles) {
                const content = fs.readFileSync(featureFile, 'utf-8');
                const scenarios = this.parseFeatureFile(content);

                for (const scenario of scenarios) {
                    // Check if test case already exists
                    const existingCases = await this.getTestCases();
                    const existingCase = existingCases.find(c => c.title === scenario.name);

                    if (existingCase) {
                        mapping[scenario.name] = existingCase.id;
                    } else {
                        // Create new test case
                        const steps = scenario.steps.map((step: any) => ({
                            content: step,
                            expected: 'Step should complete successfully'
                        }));

                        const newCase = await this.createTestCase(
                            sectionId,
                            scenario.name,
                            TestRailIntegration.CASE_TYPE.AUTOMATED,
                            TestRailIntegration.PRIORITY.MEDIUM,
                            { steps }
                        );

                        mapping[scenario.name] = newCase.id;
                    }
                }
            }

            return mapping;
        } catch (error) {
            throw new Error(`Failed to create test case mapping: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Simple parser for Gherkin feature files
     */
    private parseFeatureFile(content: string): any[] {
        const scenarios = [];
        const lines = content.split('\n');
        let currentScenario: any = null;
        let inScenario = false;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
                if (currentScenario) {
                    scenarios.push(currentScenario);
                }
                currentScenario = {
                    name: trimmed.replace(/^(Scenario:|Scenario Outline:)\s*/, ''),
                    steps: []
                };
                inScenario = true;
            } else if (inScenario && (trimmed.startsWith('Given') || trimmed.startsWith('When') || trimmed.startsWith('Then') || trimmed.startsWith('And') || trimmed.startsWith('But'))) {
                currentScenario.steps.push(trimmed);
            } else if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('Feature:') || trimmed.startsWith('Background:')) {
                // Skip empty lines, comments, feature headers, and background
                continue;
            } else if (trimmed.startsWith('Examples:') || trimmed.startsWith('|')) {
                // Skip example tables for now
                continue;
            } else if (inScenario && trimmed !== '') {
                // End of scenario
                inScenario = false;
            }
        }

        if (currentScenario) {
            scenarios.push(currentScenario);
        }

        return scenarios;
    }
}