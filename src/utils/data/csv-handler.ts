import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

import { DataEncryption } from '../encryption/data-encryption';
import { Logger } from '../logger';


const logger = Logger.getInstance();

/**
 * CSV Data Handler
 * Provides functionality to read, write, and manipulate CSV files
 */
export class CSVDataHandler {
  private encryption: DataEncryption;

  constructor() {
    this.encryption = new DataEncryption();
  }

  /**
   * Read data from CSV file
   * @param filePath - Path to CSV file
   * @param options - Additional options
   */
  async readCSVFile(
    filePath: string,
    options: {
      delimiter?: string;
      headers?: boolean;
      skipEmptyLines?: boolean;
      skipLinesWithError?: boolean;
      decrypt?: boolean;
      decryptColumns?: string[];
      encoding?: BufferEncoding;
    } = {}
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const {
          delimiter = ",",
          headers = true,
          skipEmptyLines = true,
          skipLinesWithError = false,
          decrypt = false,
          decryptColumns = [],
          encoding = "utf8",
        } = options;

        logger.info(`Reading CSV file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
          throw new Error(`CSV file not found: ${filePath}`);
        }

        const data: any[] = [];
        const errors: any[] = [];

        const stream = fs.createReadStream(filePath, { encoding }).pipe(
          csv({
            separator: delimiter,
            headers: headers,
            skipEmptyLines: skipEmptyLines,
            skipLinesWithError: skipLinesWithError,
          })
        );

        stream.on("data", async (row) => {
          try {
            // Decrypt specified columns if needed
            if (decrypt && decryptColumns.length > 0) {
              for (const column of decryptColumns) {
                if (row[column]) {
                  try {
                    row[column] = await this.encryption.decrypt(row[column]);
                  } catch (error) {
                    logger.warn(
                      `Failed to decrypt column '${column}' in row:`,
                      error
                    );
                  }
                }
              }
            }
            data.push(row);
          } catch (error) {
            errors.push({ row, error });
          }
        });

        stream.on("end", () => {
          if (errors.length > 0) {
            logger.warn(
              `Encountered ${errors.length} errors while reading CSV file`
            );
          }
          logger.info(`Successfully read ${data.length} rows from CSV file`);
          resolve(data);
        });

        stream.on("error", (error) => {
          logger.error(`Failed to read CSV file: ${filePath}`, error);
          reject(error);
        });
      } catch (error) {
        logger.error(`Failed to read CSV file: ${filePath}`, error);
        reject(error);
      }
    });
  }

  /**
   * Write data to CSV file
   * @param data - Data to write
   * @param filePath - Path to CSV file
   * @param options - Additional options
   */
  async writeCSVFile(
    data: any[],
    filePath: string,
    options: {
      headers?: string[];
      delimiter?: string;
      append?: boolean;
      encrypt?: boolean;
      encryptColumns?: string[];
      encoding?: BufferEncoding;
    } = {}
  ): Promise<void> {
    try {
      const {
        headers,
        delimiter = ",",
        append = false,
        encrypt = false,
        encryptColumns = [],
        encoding = "utf8",
      } = options;

      logger.info(`Writing data to CSV file: ${filePath}`);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (data.length === 0) {
        logger.warn("No data provided to write to CSV file");
        return;
      }

      // Determine headers
      const csvHeaders = headers || Object.keys(data[0]);

      // Encrypt specified columns if needed
      let processedData = [...data];
      if (encrypt && encryptColumns.length > 0) {
        processedData = await Promise.all(
          data.map(async (row) => {
            const newRow = { ...row };
            for (const column of encryptColumns) {
              if (newRow[column]) {
                try {
                  newRow[column] = await this.encryption.encrypt(
                    newRow[column]
                  );
                } catch (error) {
                  logger.warn(
                    `Failed to encrypt column '${column}' in row:`,
                    error
                  );
                }
              }
            }
            return newRow;
          })
        );
      }

      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: csvHeaders.map((header) => ({ id: header, title: header })),
        append: append,
        encoding: encoding,
        fieldDelimiter: delimiter,
      });

      // Write data
      await csvWriter.writeRecords(processedData);

      logger.info(
        `Successfully wrote ${processedData.length} rows to CSV file`
      );
    } catch (error) {
      logger.error(`Failed to write CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Append data to existing CSV file
   * @param data - Data to append
   * @param filePath - Path to CSV file
   * @param options - Additional options
   */
  async appendToCSV(
    data: any[],
    filePath: string,
    options: {
      delimiter?: string;
      encrypt?: boolean;
      encryptColumns?: string[];
    } = {}
  ): Promise<void> {
    try {
      logger.info(`Appending data to CSV file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        // If file doesn't exist, create it with headers
        await this.writeCSVFile(data, filePath, { ...options, append: false });
        return;
      }

      // Read existing data to get headers
      const existingData = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });
      const headers =
        existingData.length > 0
          ? Object.keys(existingData[0])
          : Object.keys(data[0]);

      // Append data
      await this.writeCSVFile(data, filePath, {
        ...options,
        headers,
        append: true,
      });

      logger.info(`Successfully appended ${data.length} rows to CSV file`);
    } catch (error) {
      logger.error(`Failed to append to CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Filter data from CSV file based on criteria
   * @param filePath - Path to CSV file
   * @param filterCriteria - Object with filter criteria
   * @param options - Additional options
   */
  async filterData(
    filePath: string,
    filterCriteria: Record<string, any>,
    options: {
      delimiter?: string;
      caseSensitive?: boolean;
      wildcardSupport?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const { caseSensitive = false, wildcardSupport = true } = options;

      logger.info(`Filtering data from CSV file: ${filePath}`);

      const data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      const filteredData = data.filter((row) => {
        return Object.entries(filterCriteria).every(([key, value]) => {
          const rowValue = caseSensitive
            ? row[key]
            : row[key]?.toString().toLowerCase();
          const filterValue = caseSensitive
            ? value
            : value?.toString().toLowerCase();

          if (
            wildcardSupport &&
            typeof filterValue === "string" &&
            filterValue.includes("*")
          ) {
            // Support wildcard matching
            const regex = new RegExp(
              filterValue.replace(/\*/g, ".*"),
              caseSensitive ? "" : "i"
            );
            return regex.test(rowValue);
          }

          return rowValue === filterValue;
        });
      });

      logger.info(
        `Filtered ${filteredData.length} rows out of ${data.length} total rows`
      );
      return filteredData;
    } catch (error) {
      logger.error(`Failed to filter data from CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get random row from CSV file
   * @param filePath - Path to CSV file
   * @param filterCriteria - Optional filter criteria
   * @param options - Additional options
   */
  async getRandomRow(
    filePath: string,
    filterCriteria?: Record<string, any>,
    options: { delimiter?: string } = {}
  ): Promise<any> {
    try {
      logger.debug(`Getting random row from CSV file: ${filePath}`);

      let data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      if (filterCriteria) {
        data = data.filter((row) => {
          return Object.entries(filterCriteria).every(
            ([key, value]) => row[key] === value
          );
        });
      }

      if (data.length === 0) {
        throw new Error("No data available to select random row");
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      const randomRow = data[randomIndex];

      logger.debug(`Selected random row at index ${randomIndex}`);
      return randomRow;
    } catch (error) {
      logger.error(
        `Failed to get random row from CSV file: ${filePath}`,
        error
      );
      throw error;
    }
  }

  /**
   * Update rows in CSV file based on criteria
   * @param filePath - Path to CSV file
   * @param searchCriteria - Criteria to find rows to update
   * @param updateData - Data to update
   * @param options - Additional options
   */
  async updateRows(
    filePath: string,
    searchCriteria: Record<string, any>,
    updateData: Record<string, any>,
    options: { delimiter?: string; createBackup?: boolean } = {}
  ): Promise<number> {
    try {
      const { createBackup = true } = options;

      logger.info(`Updating rows in CSV file: ${filePath}`);

      // Create backup if requested
      if (createBackup) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        logger.debug(`Created backup: ${backupPath}`);
      }

      // Read existing data
      const data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      // Update matching rows
      let updatedCount = 0;
      const updatedData = data.map((row) => {
        const matches = Object.entries(searchCriteria).every(
          ([key, value]) => row[key] === value
        );
        if (matches) {
          updatedCount++;
          return { ...row, ...updateData };
        }
        return row;
      });

      // Write updated data back to file
      await this.writeCSVFile(updatedData, filePath, {
        delimiter: options.delimiter,
      });

      logger.info(`Successfully updated ${updatedCount} rows in CSV file`);
      return updatedCount;
    } catch (error) {
      logger.error(`Failed to update rows in CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Delete rows from CSV file based on criteria
   * @param filePath - Path to CSV file
   * @param deleteCriteria - Criteria to find rows to delete
   * @param options - Additional options
   */
  async deleteRows(
    filePath: string,
    deleteCriteria: Record<string, any>,
    options: { delimiter?: string; createBackup?: boolean } = {}
  ): Promise<number> {
    try {
      const { createBackup = true } = options;

      logger.info(`Deleting rows from CSV file: ${filePath}`);

      // Create backup if requested
      if (createBackup) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        logger.debug(`Created backup: ${backupPath}`);
      }

      // Read existing data
      const data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      // Filter out rows that match delete criteria
      const filteredData = data.filter((row) => {
        return !Object.entries(deleteCriteria).every(
          ([key, value]) => row[key] === value
        );
      });

      const deletedCount = data.length - filteredData.length;

      // Write filtered data back to file
      await this.writeCSVFile(filteredData, filePath, {
        delimiter: options.delimiter,
      });

      logger.info(`Successfully deleted ${deletedCount} rows from CSV file`);
      return deletedCount;
    } catch (error) {
      logger.error(`Failed to delete rows from CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Validate CSV file structure
   * @param filePath - Path to CSV file
   * @param expectedColumns - Array of expected column names
   * @param options - Additional options
   */
  async validateStructure(
    filePath: string,
    expectedColumns: string[],
    options: { delimiter?: string; strict?: boolean } = {}
  ): Promise<{
    valid: boolean;
    missingColumns: string[];
    extraColumns: string[];
  }> {
    try {
      const { strict = false } = options;

      logger.debug(`Validating CSV file structure: ${filePath}`);

      const data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      if (data.length === 0) {
        return {
          valid: false,
          missingColumns: expectedColumns,
          extraColumns: [],
        };
      }

      const actualColumns = Object.keys(data[0]);
      const missingColumns = expectedColumns.filter(
        (col) => !actualColumns.includes(col)
      );
      const extraColumns = actualColumns.filter(
        (col) => !expectedColumns.includes(col)
      );

      const valid = strict
        ? missingColumns.length === 0 && extraColumns.length === 0
        : missingColumns.length === 0;

      logger.debug(
        `Structure validation - Valid: ${valid}, Missing: ${missingColumns.length}, Extra: ${extraColumns.length}`
      );

      return { valid, missingColumns, extraColumns };
    } catch (error) {
      logger.error(`Failed to validate CSV file structure: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Convert CSV to JSON
   * @param csvFilePath - Path to CSV file
   * @param jsonFilePath - Path to output JSON file
   * @param options - Additional options
   */
  async convertToJSON(
    csvFilePath: string,
    jsonFilePath?: string,
    options: { delimiter?: string; pretty?: boolean } = {}
  ): Promise<any[]> {
    try {
      const { pretty = true } = options;

      logger.info(`Converting CSV to JSON: ${csvFilePath}`);

      const data = await this.readCSVFile(csvFilePath, {
        delimiter: options.delimiter,
      });

      if (jsonFilePath) {
        // Ensure directory exists
        const dir = path.dirname(jsonFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const jsonData = pretty
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data);
        fs.writeFileSync(jsonFilePath, jsonData, "utf8");

        logger.info(`Successfully converted CSV to JSON: ${jsonFilePath}`);
      }

      return data;
    } catch (error) {
      logger.error(`Failed to convert CSV to JSON: ${csvFilePath}`, error);
      throw error;
    }
  }

  /**
   * Get summary statistics for CSV file
   * @param filePath - Path to CSV file
   * @param options - Additional options
   */
  async getStatistics(
    filePath: string,
    options: { delimiter?: string } = {}
  ): Promise<{
    totalRows: number;
    totalColumns: number;
    columns: string[];
    emptyRows: number;
    fileSize: number;
  }> {
    try {
      logger.debug(`Getting statistics for CSV file: ${filePath}`);

      const stats = fs.statSync(filePath);
      const data = await this.readCSVFile(filePath, {
        delimiter: options.delimiter,
      });

      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      const emptyRows = data.filter((row) =>
        Object.values(row).every(
          (value) => !value || value.toString().trim() === ""
        )
      ).length;

      const statistics = {
        totalRows: data.length,
        totalColumns: columns.length,
        columns: columns,
        emptyRows: emptyRows,
        fileSize: stats.size,
      };

      logger.debug("CSV file statistics:", statistics);
      return statistics;
    } catch (error) {
      logger.error(`Failed to get statistics for CSV file: ${filePath}`, error);
      throw error;
    }
  }
}
