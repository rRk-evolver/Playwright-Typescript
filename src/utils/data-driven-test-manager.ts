import * as fs from 'fs';
import * as path from 'path';

import { CSVDataHandler } from './data/csv-handler';
import { ExcelDataHandler } from './data/excel-handler';
import { JSONDataHandler } from './data/json-handler';
import { Logger } from './logger';


const logger = Logger.getInstance();

/**
 * Unified Data-Driven Test Manager
 * Provides centralized management for all data-driven testing operations
 */
export class DataDrivenTestManager {
  private csvHandler: CSVDataHandler;
  private excelHandler: ExcelDataHandler;
  private jsonHandler: JSONDataHandler;

  private testDataCache: Map<string, any[]> = new Map();
  private configCache: Map<string, any> = new Map();

  constructor() {
    this.csvHandler = new CSVDataHandler();
    this.excelHandler = new ExcelDataHandler();
    this.jsonHandler = new JSONDataHandler();

    logger.info("🚀 Data-Driven Test Manager initialized");
  }

  /**
   * Load test data from any supported format with caching
   * @param filePath - Path to data file
   * @param options - Loading options
   */
  async loadTestData(
    filePath: string,
    options: {
      sheetName?: string;
      useCache?: boolean;
      filterCriteria?: Record<string, any>;
      sampleSize?: number;
      randomSample?: boolean;
    } = {}
  ): Promise<any[]> {
    const {
      useCache = true,
      filterCriteria,
      sampleSize,
      randomSample = false,
    } = options;
    const absolutePath = path.resolve(filePath);
    const cacheKey = `${absolutePath}_${JSON.stringify(options)}`;

    // Return cached data if available
    if (useCache && this.testDataCache.has(cacheKey)) {
      logger.debug(`🔄 Returning cached data for: ${filePath}`);
      return this.testDataCache.get(cacheKey)!;
    }

    logger.info(`📂 Loading test data from: ${filePath}`);

    let data: any[] = [];
    const fileExtension = path.extname(absolutePath).toLowerCase();

    try {
      switch (fileExtension) {
        case ".csv":
          data = await this.csvHandler.readCSVFile(absolutePath, {
            headers: true,
            skipEmptyLines: true,
          });
          break;

        case ".xlsx":
        case ".xls":
          data = await this.excelHandler.readExcelFile(
            absolutePath,
            options.sheetName,
            {
              hasHeaders: true,
              skipEmptyRows: true,
            }
          );
          break;

        case ".json":
          const jsonData = await this.jsonHandler.readJSONFile(absolutePath);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
          break;

        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      // Apply filtering if specified
      if (filterCriteria) {
        data = this.filterData(data, filterCriteria);
        logger.info(`🔍 Applied filters, ${data.length} records remaining`);
      }

      // Apply sampling if specified
      if (sampleSize && sampleSize < data.length) {
        data = randomSample
          ? this.getRandomSample(data, sampleSize)
          : data.slice(0, sampleSize);
        logger.info(`📊 Applied sampling, using ${data.length} records`);
      }

      // Cache the data
      if (useCache) {
        this.testDataCache.set(cacheKey, data);
      }

      logger.info(`✅ Loaded ${data.length} records from ${filePath}`);
      return data;
    } catch (error) {
      logger.error(`❌ Failed to load test data from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load configuration data
   * @param configPath - Path to configuration file
   * @param useCache - Whether to use caching
   */
  async loadConfiguration(
    configPath: string,
    useCache: boolean = true
  ): Promise<any> {
    const absolutePath = path.resolve(configPath);

    if (useCache && this.configCache.has(absolutePath)) {
      logger.debug(`🔄 Returning cached configuration for: ${configPath}`);
      return this.configCache.get(absolutePath);
    }

    logger.info(`⚙️ Loading configuration from: ${configPath}`);

    try {
      const config = await this.jsonHandler.readJSONFile(absolutePath);

      if (useCache) {
        this.configCache.set(absolutePath, config);
      }

      logger.info(`✅ Configuration loaded successfully`);
      return config;
    } catch (error) {
      logger.error(
        `❌ Failed to load configuration from ${configPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Execute data-driven tests with multiple data sources
   * @param testConfig - Test execution configuration
   */
  async executeDataDrivenTests(testConfig: {
    testFunction: (data: any, index: number, source: string) => Promise<void>;
    dataSources: Array<{
      path: string;
      type: "csv" | "excel" | "json";
      sheetName?: string;
      label?: string;
      filterCriteria?: Record<string, any>;
    }>;
    parallel?: boolean;
    maxConcurrency?: number;
    continueOnFailure?: boolean;
    generateReport?: boolean;
  }): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    results: Array<{
      source: string;
      index: number;
      status: "passed" | "failed" | "skipped";
      duration: number;
      error?: string;
      data?: any;
    }>;
  }> {
    const {
      testFunction,
      dataSources,
      parallel = false,
      maxConcurrency = 4,
      continueOnFailure = true,
      generateReport = true,
    } = testConfig;

    logger.info(
      `🔄 Executing data-driven tests with ${dataSources.length} data sources`
    );

    const results: any[] = [];
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const dataSource of dataSources) {
      try {
        logger.info(`📊 Processing data source: ${dataSource.path}`);

        const data = await this.loadTestData(dataSource.path, {
          ...(dataSource.sheetName && { sheetName: dataSource.sheetName }),
          ...(dataSource.filterCriteria && {
            filterCriteria: dataSource.filterCriteria,
          }),
        });

        const sourceLabel = dataSource.label || path.basename(dataSource.path);
        totalTests += data.length;

        if (parallel) {
          // Execute tests in parallel with concurrency limit
          const chunks = this.chunkArray(data, maxConcurrency);

          for (const chunk of chunks) {
            const promises = chunk.map(async (record, chunkIndex) => {
              const globalIndex = chunks.flat().indexOf(record);
              return this.executeSingleTest(
                testFunction,
                record,
                globalIndex,
                sourceLabel,
                continueOnFailure
              );
            });

            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
          }
        } else {
          // Execute tests sequentially
          for (let i = 0; i < data.length; i++) {
            const result = await this.executeSingleTest(
              testFunction,
              data[i],
              i,
              sourceLabel,
              continueOnFailure
            );
            results.push(result);
          }
        }
      } catch (error) {
        logger.error(
          `❌ Failed to process data source ${dataSource.path}:`,
          error
        );

        if (!continueOnFailure) {
          throw error;
        }
      }
    }

    // Calculate final statistics
    results.forEach((result) => {
      switch (result.status) {
        case "passed":
          passed++;
          break;
        case "failed":
          failed++;
          break;
        case "skipped":
          skipped++;
          break;
      }
    });

    const summary = {
      totalTests,
      passed,
      failed,
      skipped,
      results,
    };

    logger.info(`🏁 Data-driven test execution completed:`);
    logger.info(`   Total: ${totalTests}`);
    logger.info(`   Passed: ${passed}`);
    logger.info(`   Failed: ${failed}`);
    logger.info(`   Skipped: ${skipped}`);
    logger.info(`   Pass Rate: ${((passed / totalTests) * 100).toFixed(2)}%`);

    if (generateReport) {
      await this.generateReport(summary);
    }

    return summary;
  }

  /**
   * Export test data to different format
   * @param data - Data to export
   * @param outputPath - Output file path
   * @param options - Export options
   */
  async exportData(
    data: any[],
    outputPath: string,
    options: {
      sheetName?: string;
      pretty?: boolean;
      includeHeaders?: boolean;
      encryption?: {
        enabled: boolean;
        columns: string[];
      };
    } = {}
  ): Promise<void> {
    const {
      sheetName = "Sheet1",
      pretty = true,
      includeHeaders = true,
      encryption,
    } = options;
    const absolutePath = path.resolve(outputPath);
    const fileExtension = path.extname(absolutePath).toLowerCase();

    logger.info(`📤 Exporting ${data.length} records to: ${outputPath}`);

    try {
      switch (fileExtension) {
        case ".csv":
          const csvOptions: any = {};
          if (includeHeaders) {
            csvOptions.headers = Object.keys(data[0] || {});
          }
          if (encryption?.enabled !== undefined) {
            csvOptions.encrypt = encryption.enabled;
          }
          if (encryption?.columns) {
            csvOptions.encryptColumns = encryption.columns;
          }
          await this.csvHandler.writeCSVFile(data, absolutePath, csvOptions);
          break;

        case ".xlsx":
        case ".xls":
          const excelOptions: any = {};
          if (encryption?.enabled !== undefined) {
            excelOptions.encrypt = encryption.enabled;
          }
          if (encryption?.columns) {
            excelOptions.encryptColumns = encryption.columns;
          }
          await this.excelHandler.writeExcelFile(
            data,
            absolutePath,
            sheetName,
            excelOptions
          );
          break;

        case ".json":
          const jsonOptions: any = { pretty };
          if (encryption?.enabled !== undefined) {
            jsonOptions.encrypt = encryption.enabled;
          }
          if (encryption?.columns) {
            jsonOptions.encryptPaths = encryption.columns;
          }
          await this.jsonHandler.writeJSONFile(data, absolutePath, jsonOptions);
          break;

        default:
          throw new Error(`Unsupported export format: ${fileExtension}`);
      }

      logger.info(`✅ Data exported successfully to: ${outputPath}`);
    } catch (error) {
      logger.error(`❌ Failed to export data to ${outputPath}:`, error);
      throw error;
    }
  }

  /**
   * Validate data integrity across different formats
   * @param dataSources - Array of data source paths
   */
  async validateDataIntegrity(dataSources: string[]): Promise<{
    valid: boolean;
    issues: Array<{
      source: string;
      issue: string;
      severity: "low" | "medium" | "high";
    }>;
  }> {
    logger.info(
      `🔍 Validating data integrity for ${dataSources.length} sources`
    );

    const issues: any[] = [];
    let valid = true;

    for (const source of dataSources) {
      try {
        const data = await this.loadTestData(source, { useCache: false });

        // Check for empty data
        if (data.length === 0) {
          issues.push({
            source,
            issue: "Data source is empty",
            severity: "high",
          });
          valid = false;
        }

        // Check for inconsistent structure
        if (data.length > 1) {
          const firstKeys = Object.keys(data[0]).sort();
          for (let i = 1; i < data.length; i++) {
            const currentKeys = Object.keys(data[i]).sort();
            if (JSON.stringify(firstKeys) !== JSON.stringify(currentKeys)) {
              issues.push({
                source,
                issue: `Inconsistent structure at record ${i + 1}`,
                severity: "medium",
              });
            }
          }
        }

        // Check for missing required fields
        const requiredFields = ["testType", "priority"];
        for (const record of data) {
          for (const field of requiredFields) {
            if (!record[field]) {
              issues.push({
                source,
                issue: `Missing required field '${field}' in some records`,
                severity: "medium",
              });
            }
          }
        }
      } catch (error) {
        issues.push({
          source,
          issue: `Failed to load data source: ${(error as Error).message}`,
          severity: "high",
        });
        valid = false;
      }
    }

    logger.info(
      `🏁 Data integrity validation completed: ${valid ? "PASSED" : "FAILED"}`
    );
    if (issues.length > 0) {
      logger.warn(`⚠️ Found ${issues.length} data integrity issues`);
    }

    return { valid, issues };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.testDataCache.clear();
    this.configCache.clear();
    logger.info("🧹 Cache cleared successfully");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    testDataEntries: number;
    configEntries: number;
    totalMemoryUsage: string;
  } {
    const testDataEntries = this.testDataCache.size;
    const configEntries = this.configCache.size;

    // Rough memory usage estimation
    let memoryUsage = 0;
    this.testDataCache.forEach((data) => {
      memoryUsage += JSON.stringify(data).length;
    });
    this.configCache.forEach((config) => {
      memoryUsage += JSON.stringify(config).length;
    });

    return {
      testDataEntries,
      configEntries,
      totalMemoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`,
    };
  }

  // Private helper methods

  private filterData(data: any[], criteria: Record<string, any>): any[] {
    return data.filter((record) => {
      return Object.entries(criteria).every(([key, value]) => {
        if (typeof value === "string" && value.includes("*")) {
          const regex = new RegExp(value.replace(/\*/g, ".*"), "i");
          return regex.test(record[key]);
        }
        return record[key] === value;
      });
    });
  }

  private getRandomSample(data: any[], sampleSize: number): any[] {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async executeSingleTest(
    testFunction: (data: any, index: number, source: string) => Promise<void>,
    data: any,
    index: number,
    source: string,
    continueOnFailure: boolean
  ): Promise<any> {
    const startTime = Date.now();

    try {
      await testFunction(data, index, source);

      return {
        source,
        index,
        status: "passed",
        duration: Date.now() - startTime,
        data,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`❌ Test failed for ${source}[${index}]: ${errorMessage}`);

      if (!continueOnFailure) {
        throw error;
      }

      return {
        source,
        index,
        status: "failed",
        duration: Date.now() - startTime,
        error: errorMessage,
        data,
      };
    }
  }

  private async generateReport(summary: any): Promise<void> {
    const reportPath = path.resolve(
      "reports/data-driven-execution-report.json"
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        skipped: summary.skipped,
        passRate: `${((summary.passed / summary.totalTests) * 100).toFixed(2)}%`,
      },
      details: summary.results,
      cacheStats: this.getCacheStats(),
    };

    await this.jsonHandler.writeJSONFile(report, reportPath, { pretty: true });
    logger.info(`📊 Execution report generated: ${reportPath}`);
  }
}
