import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../logger';
import { DataEncryption } from '../encryption/data-encryption';

const logger = Logger.getInstance();

/**
 * Excel Data Handler
 * Provides functionality to read, write, and manipulate Excel files
 */
export class ExcelDataHandler {
  private encryption: DataEncryption;

  constructor() {
    this.encryption = new DataEncryption();
  }

  /**
   * Read data from Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Name of the sheet to read (optional, reads first sheet if not provided)
   * @param options - Additional options
   */
  async readExcelFile(
    filePath: string, 
    sheetName?: string,
    options: {
      hasHeaders?: boolean;
      range?: string;
      skipEmptyRows?: boolean;
      decrypt?: boolean;
      decryptColumns?: string[];
    } = {}
  ): Promise<any[]> {
    try {
      const { hasHeaders = true, range, skipEmptyRows = true, decrypt = false, decryptColumns = [] } = options;
      
      logger.info(`Reading Excel file: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
      }

      // Read the workbook
      const workbook = XLSX.readFile(filePath);
      
      // Get sheet name
      const targetSheetName = sheetName || workbook.SheetNames[0];
      
      if (!targetSheetName || !workbook.Sheets[targetSheetName]) {
        throw new Error(`Sheet '${targetSheetName}' not found in Excel file`);
      }

      const worksheet = workbook.Sheets[targetSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: hasHeaders ? 1 : 'A',
        range: range,
        blankrows: !skipEmptyRows,
        defval: ''
      });

      // Decrypt specified columns if needed
      if (decrypt && decryptColumns.length > 0) {
        for (const row of jsonData as any[]) {
          for (const column of decryptColumns) {
            if (row[column]) {
              try {
                row[column] = await this.encryption.decrypt(row[column]);
              } catch (error) {
                logger.warn(`Failed to decrypt column '${column}' in row:`, error);
              }
            }
          }
        }
      }

      logger.info(`Successfully read ${jsonData.length} rows from Excel file`);
      return jsonData;
    } catch (error) {
      logger.error(`Failed to read Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write data to Excel file
   * @param data - Data to write
   * @param filePath - Path to Excel file
   * @param sheetName - Name of the sheet
   * @param options - Additional options
   */
  async writeExcelFile(
    data: any[], 
    filePath: string, 
    sheetName: string = 'Sheet1',
    options: {
      append?: boolean;
      encrypt?: boolean;
      encryptColumns?: string[];
      password?: string;
    } = {}
  ): Promise<void> {
    try {
      const { append = false, encrypt = false, encryptColumns = [], password } = options;
      
      logger.info(`Writing data to Excel file: ${filePath}`);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let workbook: XLSX.WorkBook;
      
      if (append && fs.existsSync(filePath)) {
        // Read existing workbook
        workbook = XLSX.readFile(filePath);
      } else {
        // Create new workbook
        workbook = XLSX.utils.book_new();
      }

      // Encrypt specified columns if needed
      let processedData = [...data];
      if (encrypt && encryptColumns.length > 0) {
        processedData = await Promise.all(
          data.map(async (row) => {
            const newRow = { ...row };
            for (const column of encryptColumns) {
              if (newRow[column]) {
                try {
                  newRow[column] = await this.encryption.encrypt(newRow[column]);
                } catch (error) {
                  logger.warn(`Failed to encrypt column '${column}' in row:`, error);
                }
              }
            }
            return newRow;
          })
        );
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      
      // Add or update worksheet
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Write workbook
      const writeOptions: XLSX.WritingOptions = {
        bookType: 'xlsx',
        type: 'file'
      };

      if (password) {
        writeOptions.password = password;
      }

      XLSX.writeFile(workbook, filePath, writeOptions);
      
      logger.info(`Successfully wrote ${processedData.length} rows to Excel file`);
    } catch (error) {
      logger.error(`Failed to write Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Read specific cell value from Excel file
   * @param filePath - Path to Excel file
   * @param cellAddress - Cell address (e.g., 'A1', 'B2')
   * @param sheetName - Name of the sheet
   */
  async readCell(filePath: string, cellAddress: string, sheetName?: string): Promise<any> {
    try {
      logger.debug(`Reading cell ${cellAddress} from Excel file: ${filePath}`);
      
      const workbook = XLSX.readFile(filePath);
      const targetSheetName = sheetName || workbook.SheetNames[0];
      if (!targetSheetName) {
        throw new Error('No sheets found in Excel file');
      }
      const worksheet = workbook.Sheets[targetSheetName];
      if (!worksheet) {
        throw new Error(`Worksheet '${targetSheetName}' not found`);
      }
      
      const cell = worksheet[cellAddress];
      const value = cell ? cell.v : null;
      
      logger.debug(`Cell ${cellAddress} value: ${value}`);
      return value;
    } catch (error) {
      logger.error(`Failed to read cell ${cellAddress} from Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write value to specific cell in Excel file
   * @param filePath - Path to Excel file
   * @param cellAddress - Cell address (e.g., 'A1', 'B2')
   * @param value - Value to write
   * @param sheetName - Name of the sheet
   */
  async writeCell(filePath: string, cellAddress: string, value: any, sheetName?: string): Promise<void> {
    try {
      logger.debug(`Writing value '${value}' to cell ${cellAddress} in Excel file: ${filePath}`);
      
      let workbook: XLSX.WorkBook;
      
      if (fs.existsSync(filePath)) {
        workbook = XLSX.readFile(filePath);
      } else {
        workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Sheet1');
      }
      
      const targetSheetName = sheetName || workbook.SheetNames[0];
      if (!targetSheetName) {
        throw new Error('No sheets found in Excel file');
      }
      const worksheet = workbook.Sheets[targetSheetName];
      if (!worksheet) {
        throw new Error(`Worksheet '${targetSheetName}' not found`);
      }
      
      // Set cell value
      XLSX.utils.sheet_add_aoa(worksheet, [[value]], { origin: cellAddress });
      
      // Write workbook
      XLSX.writeFile(workbook, filePath);
      
      logger.debug(`Successfully wrote value to cell ${cellAddress}`);
    } catch (error) {
      logger.error(`Failed to write cell ${cellAddress} in Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get all sheet names from Excel file
   * @param filePath - Path to Excel file
   */
  async getSheetNames(filePath: string): Promise<string[]> {
    try {
      logger.debug(`Getting sheet names from Excel file: ${filePath}`);
      
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      
      logger.debug(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
      return sheetNames;
    } catch (error) {
      logger.error(`Failed to get sheet names from Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Add new sheet to existing Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Name of new sheet
   * @param data - Data for the new sheet (optional)
   */
  async addSheet(filePath: string, sheetName: string, data?: any[]): Promise<void> {
    try {
      logger.info(`Adding sheet '${sheetName}' to Excel file: ${filePath}`);
      
      let workbook: XLSX.WorkBook;
      
      if (fs.existsSync(filePath)) {
        workbook = XLSX.readFile(filePath);
      } else {
        workbook = XLSX.utils.book_new();
      }
      
      // Check if sheet already exists
      if (workbook.Sheets[sheetName]) {
        logger.warn(`Sheet '${sheetName}' already exists, will be overwritten`);
      }
      
      // Create worksheet
      const worksheet = data && data.length > 0 
        ? XLSX.utils.json_to_sheet(data)
        : XLSX.utils.aoa_to_sheet([[]]);
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write workbook
      XLSX.writeFile(workbook, filePath);
      
      logger.info(`Successfully added sheet '${sheetName}' to Excel file`);
    } catch (error) {
      logger.error(`Failed to add sheet '${sheetName}' to Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Filter data from Excel file based on criteria
   * @param filePath - Path to Excel file
   * @param filterCriteria - Object with filter criteria
   * @param sheetName - Name of the sheet
   */
  async filterData(
    filePath: string, 
    filterCriteria: Record<string, any>, 
    sheetName?: string
  ): Promise<any[]> {
    try {
      logger.info(`Filtering data from Excel file: ${filePath}`);
      
      const data = await this.readExcelFile(filePath, sheetName);
      
      const filteredData = data.filter(row => {
        return Object.entries(filterCriteria).every(([key, value]) => {
          if (typeof value === 'string' && value.includes('*')) {
            // Support wildcard matching
            const regex = new RegExp(value.replace(/\*/g, '.*'), 'i');
            return regex.test(row[key]);
          }
          return row[key] === value;
        });
      });
      
      logger.info(`Filtered ${filteredData.length} rows out of ${data.length} total rows`);
      return filteredData;
    } catch (error) {
      logger.error(`Failed to filter data from Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get random row from Excel file
   * @param filePath - Path to Excel file
   * @param sheetName - Name of the sheet
   * @param filterCriteria - Optional filter criteria
   */
  async getRandomRow(
    filePath: string, 
    sheetName?: string, 
    filterCriteria?: Record<string, any>
  ): Promise<any> {
    try {
      logger.debug(`Getting random row from Excel file: ${filePath}`);
      
      let data = await this.readExcelFile(filePath, sheetName);
      
      if (filterCriteria) {
        data = await this.filterData(filePath, filterCriteria, sheetName);
      }
      
      if (data.length === 0) {
        throw new Error('No data available to select random row');
      }
      
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomRow = data[randomIndex];
      
      logger.debug(`Selected random row at index ${randomIndex}`);
      return randomRow;
    } catch (error) {
      logger.error(`Failed to get random row from Excel file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Validate Excel file structure
   * @param filePath - Path to Excel file
   * @param expectedColumns - Array of expected column names
   * @param sheetName - Name of the sheet
   */
  async validateStructure(
    filePath: string, 
    expectedColumns: string[], 
    sheetName?: string
  ): Promise<{ valid: boolean; missingColumns: string[]; extraColumns: string[] }> {
    try {
      logger.debug(`Validating Excel file structure: ${filePath}`);
      
      const data = await this.readExcelFile(filePath, sheetName, { hasHeaders: true });
      
      if (data.length === 0) {
        return { valid: false, missingColumns: expectedColumns, extraColumns: [] };
      }
      
      const actualColumns = Object.keys(data[0]);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
      
      const valid = missingColumns.length === 0;
      
      logger.debug(`Structure validation - Valid: ${valid}, Missing: ${missingColumns.length}, Extra: ${extraColumns.length}`);
      
      return { valid, missingColumns, extraColumns };
    } catch (error) {
      logger.error(`Failed to validate Excel file structure: ${filePath}`, error);
      throw error;
    }
  }
}