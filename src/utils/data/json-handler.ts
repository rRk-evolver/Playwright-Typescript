import * as fs from 'fs';
import * as path from 'path';

import { DataEncryption } from '../encryption/data-encryption';
import { Logger } from '../logger';


const logger = Logger.getInstance();

/**
 * JSON Data Handler
 * Provides functionality to read, write, and manipulate JSON files
 */
export class JSONDataHandler {
  private encryption: DataEncryption;

  constructor() {
    this.encryption = new DataEncryption();
  }

  /**
   * Read data from JSON file
   * @param filePath - Path to JSON file
   * @param options - Additional options
   */
  async readJSONFile<T = any>(
    filePath: string,
    options: {
      encoding?: BufferEncoding;
      decrypt?: boolean;
      decryptPaths?: string[];
      validateJSON?: boolean;
    } = {}
  ): Promise<T> {
    try {
      const {
        encoding = "utf8",
        decrypt = false,
        decryptPaths = [],
        validateJSON = true,
      } = options;

      logger.info(`Reading JSON file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`JSON file not found: ${filePath}`);
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath, { encoding });

      // Validate JSON if requested
      if (validateJSON && !this.isValidJSON(fileContent)) {
        throw new Error(`Invalid JSON format in file: ${filePath}`);
      }

      // Parse JSON
      let data = JSON.parse(fileContent);

      // Decrypt specified paths if needed
      if (decrypt && decryptPaths.length > 0) {
        data = await this.decryptData(data, decryptPaths);
      }

      logger.info(
        `Successfully read JSON file with ${JSON.stringify(data).length} characters`
      );
      return data;
    } catch (error) {
      logger.error(`Failed to read JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write data to JSON file
   * @param data - Data to write
   * @param filePath - Path to JSON file
   * @param options - Additional options
   */
  async writeJSONFile<T = any>(
    data: T,
    filePath: string,
    options: {
      pretty?: boolean;
      indent?: number;
      encoding?: BufferEncoding;
      createBackup?: boolean;
      encrypt?: boolean;
      encryptPaths?: string[];
    } = {}
  ): Promise<void> {
    try {
      const {
        pretty = true,
        indent = 2,
        encoding = "utf8",
        createBackup = false,
        encrypt = false,
        encryptPaths = [],
      } = options;

      logger.info(`Writing data to JSON file: ${filePath}`);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create backup if requested and file exists
      if (createBackup && fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        logger.debug(`Created backup: ${backupPath}`);
      }

      // Encrypt specified paths if needed
      let processedData = data;
      if (encrypt && encryptPaths.length > 0) {
        processedData = await this.encryptData(data, encryptPaths);
      }

      // Convert to JSON string
      const jsonString = pretty
        ? JSON.stringify(processedData, null, indent)
        : JSON.stringify(processedData);

      // Write to file
      fs.writeFileSync(filePath, jsonString, { encoding });

      logger.info(
        `Successfully wrote JSON file with ${jsonString.length} characters`
      );
    } catch (error) {
      logger.error(`Failed to write JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Update specific property in JSON file
   * @param filePath - Path to JSON file
   * @param propertyPath - Dot notation path to property (e.g., 'user.name', 'settings.theme')
   * @param value - New value
   * @param options - Additional options
   */
  async updateProperty(
    filePath: string,
    propertyPath: string,
    value: any,
    options: {
      createIfNotExists?: boolean;
      createBackup?: boolean;
      pretty?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const {
        createIfNotExists = true,
        createBackup = true,
        pretty = true,
      } = options;

      logger.info(
        `Updating property '${propertyPath}' in JSON file: ${filePath}`
      );

      // Read existing data or create empty object
      let data: any = {};
      if (fs.existsSync(filePath)) {
        data = await this.readJSONFile(filePath);
      } else if (!createIfNotExists) {
        throw new Error(
          `JSON file not found and createIfNotExists is false: ${filePath}`
        );
      }

      // Update property using dot notation
      this.setPropertyByPath(data, propertyPath, value);

      // Write updated data
      await this.writeJSONFile(data, filePath, { pretty, createBackup });

      logger.info(`Successfully updated property '${propertyPath}'`);
    } catch (error) {
      logger.error(
        `Failed to update property '${propertyPath}' in JSON file: ${filePath}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get specific property from JSON file
   * @param filePath - Path to JSON file
   * @param propertyPath - Dot notation path to property
   * @param defaultValue - Default value if property not found
   */
  async getProperty<T = any>(
    filePath: string,
    propertyPath: string,
    defaultValue?: T
  ): Promise<T> {
    try {
      logger.debug(
        `Getting property '${propertyPath}' from JSON file: ${filePath}`
      );

      const data = await this.readJSONFile(filePath);
      const value = this.getPropertyByPath(data, propertyPath);

      if (value === undefined && defaultValue !== undefined) {
        logger.debug(
          `Property '${propertyPath}' not found, returning default value`
        );
        return defaultValue;
      }

      logger.debug(`Property '${propertyPath}' value:`, value);
      return value;
    } catch (error) {
      if (defaultValue !== undefined) {
        logger.warn(
          `Failed to get property '${propertyPath}', returning default value:`,
          error
        );
        return defaultValue;
      }
      logger.error(
        `Failed to get property '${propertyPath}' from JSON file: ${filePath}`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete property from JSON file
   * @param filePath - Path to JSON file
   * @param propertyPath - Dot notation path to property
   * @param options - Additional options
   */
  async deleteProperty(
    filePath: string,
    propertyPath: string,
    options: { createBackup?: boolean; pretty?: boolean } = {}
  ): Promise<boolean> {
    try {
      const { createBackup = true, pretty = true } = options;

      logger.info(
        `Deleting property '${propertyPath}' from JSON file: ${filePath}`
      );

      const data = await this.readJSONFile(filePath);
      const deleted = this.deletePropertyByPath(data, propertyPath);

      if (deleted) {
        await this.writeJSONFile(data, filePath, { pretty, createBackup });
        logger.info(`Successfully deleted property '${propertyPath}'`);
      } else {
        logger.warn(`Property '${propertyPath}' not found for deletion`);
      }

      return deleted;
    } catch (error) {
      logger.error(
        `Failed to delete property '${propertyPath}' from JSON file: ${filePath}`,
        error
      );
      throw error;
    }
  }

  /**
   * Merge JSON data with existing file
   * @param filePath - Path to JSON file
   * @param newData - Data to merge
   * @param options - Additional options
   */
  async mergeData<T = any>(
    filePath: string,
    newData: Partial<T>,
    options: {
      deep?: boolean;
      createIfNotExists?: boolean;
      createBackup?: boolean;
      pretty?: boolean;
    } = {}
  ): Promise<T> {
    try {
      const {
        deep = true,
        createIfNotExists = true,
        createBackup = true,
        pretty = true,
      } = options;

      logger.info(`Merging data with JSON file: ${filePath}`);

      // Read existing data or create empty object
      let existingData: any = {};
      if (fs.existsSync(filePath)) {
        existingData = await this.readJSONFile(filePath);
      } else if (!createIfNotExists) {
        throw new Error(
          `JSON file not found and createIfNotExists is false: ${filePath}`
        );
      }

      // Merge data
      const mergedData = deep
        ? this.deepMerge(existingData, newData)
        : { ...existingData, ...newData };

      // Write merged data
      await this.writeJSONFile(mergedData, filePath, { pretty, createBackup });

      logger.info("Successfully merged data with JSON file");
      return mergedData;
    } catch (error) {
      logger.error(`Failed to merge data with JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Query JSON data using simple criteria
   * @param filePath - Path to JSON file
   * @param query - Query criteria
   */
  async queryData(
    filePath: string,
    query: Record<string, any>
  ): Promise<any[]> {
    try {
      logger.info(`Querying JSON file: ${filePath}`);

      const data = await this.readJSONFile(filePath);

      // If data is not an array, return empty array
      if (!Array.isArray(data)) {
        logger.warn("JSON data is not an array, cannot query");
        return [];
      }

      // Filter data based on query criteria
      const results = data.filter((item) => {
        return Object.entries(query).every(([key, value]) => {
          const itemValue = this.getPropertyByPath(item, key);

          if (typeof value === "string" && value.includes("*")) {
            // Support wildcard matching
            const regex = new RegExp(value.replace(/\*/g, ".*"), "i");
            return regex.test(itemValue);
          }

          return itemValue === value;
        });
      });

      logger.info(`Query returned ${results.length} results`);
      return results;
    } catch (error) {
      logger.error(`Failed to query JSON file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Validate JSON file against schema
   * @param filePath - Path to JSON file
   * @param schema - JSON schema or validation function
   */
  async validateData<T = any>(
    filePath: string,
    schema: any | ((data: any) => boolean)
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      logger.info(`Validating JSON file: ${filePath}`);

      const data = await this.readJSONFile<T>(filePath);

      if (typeof schema === "function") {
        // Use custom validation function
        const valid = schema(data);
        return { valid, errors: valid ? [] : ["Custom validation failed"] };
      } else {
        // Simple schema validation (basic implementation)
        const errors = this.validateAgainstSchema(data, schema);
        return { valid: errors.length === 0, errors };
      }
    } catch (error) {
      logger.error(`Failed to validate JSON file: ${filePath}`, error);
      return {
        valid: false,
        errors: [(error as any)?.message || "Unknown error"],
      };
    }
  }

  /**
   * Get random item from JSON array
   * @param filePath - Path to JSON file
   * @param filterCriteria - Optional filter criteria
   */
  async getRandomItem(
    filePath: string,
    filterCriteria?: Record<string, any>
  ): Promise<any> {
    try {
      logger.debug(`Getting random item from JSON file: ${filePath}`);

      let data = await this.readJSONFile(filePath);

      if (!Array.isArray(data)) {
        throw new Error("JSON data must be an array to select random item");
      }

      if (filterCriteria) {
        data = data.filter((item) => {
          return Object.entries(filterCriteria).every(([key, value]) => {
            return this.getPropertyByPath(item, key) === value;
          });
        });
      }

      if (data.length === 0) {
        throw new Error("No data available to select random item");
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[randomIndex];

      logger.debug(`Selected random item at index ${randomIndex}`);
      return randomItem;
    } catch (error) {
      logger.error(
        `Failed to get random item from JSON file: ${filePath}`,
        error
      );
      throw error;
    }
  }

  // Private helper methods

  /**
   * Check if string is valid JSON
   */
  private isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get property by dot notation path
   */
  private getPropertyByPath(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set property by dot notation path
   */
  private setPropertyByPath(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Delete property by dot notation path
   */
  private deletePropertyByPath(obj: any, path: string): boolean {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current?.[key], obj);

    if (target && lastKey in target) {
      delete target[lastKey];
      return true;
    }
    return false;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Encrypt specified paths in data
   */
  private async encryptData(data: any, encryptPaths: string[]): Promise<any> {
    const result = JSON.parse(JSON.stringify(data)); // Deep clone

    for (const path of encryptPaths) {
      const value = this.getPropertyByPath(result, path);
      if (value !== undefined) {
        try {
          const encryptedValue = await this.encryption.encrypt(
            value.toString()
          );
          this.setPropertyByPath(result, path, encryptedValue);
        } catch (error) {
          logger.warn(`Failed to encrypt path '${path}':`, error);
        }
      }
    }

    return result;
  }

  /**
   * Decrypt specified paths in data
   */
  private async decryptData(data: any, decryptPaths: string[]): Promise<any> {
    const result = JSON.parse(JSON.stringify(data)); // Deep clone

    for (const path of decryptPaths) {
      const value = this.getPropertyByPath(result, path);
      if (value !== undefined) {
        try {
          const decryptedValue = await this.encryption.decrypt(
            value.toString()
          );
          this.setPropertyByPath(result, path, decryptedValue);
        } catch (error) {
          logger.warn(`Failed to decrypt path '${path}':`, error);
        }
      }
    }

    return result;
  }

  /**
   * Simple schema validation
   */
  private validateAgainstSchema(data: any, schema: any): string[] {
    const errors: string[] = [];

    // This is a basic implementation - you might want to use a library like Ajv for more complex validation
    if (schema.type && typeof data !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof data}`);
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    return errors;
  }
}
