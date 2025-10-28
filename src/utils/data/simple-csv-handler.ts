import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger';

const logger = Logger.getInstance();

/**
 * Simplified CSV Data Handler for demonstration
 * Provides basic CSV read/write functionality
 */
export class SimpleCSVHandler {
  constructor() {
    logger.debug('SimpleCSVHandler initialized');
  }

  /**
   * Read CSV file and parse to array of objects
   * @param filePath - Path to CSV file
   * @returns Array of objects representing CSV rows
   */
  async readCSVFile(filePath: string): Promise<any[]> {
    try {
      logger.info(`Reading CSV file: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) {
        return [];
      }

      // Parse headers
      const headers = lines[0]?.split(',').map(header => header.trim()) || [];
      
      // Parse data rows
      const data: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]?.split(',').map(value => value.trim()) || [];
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        data.push(row);
      }

      logger.info(`Successfully read ${data.length} rows from CSV file`);
      return data;

    } catch (error: any) {
      logger.error(`Failed to read CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write array of objects to CSV file
   * @param data - Data to write
   * @param filePath - Output file path
   */
  async writeCSVFile(data: any[], filePath: string): Promise<void> {
    try {
      logger.info(`Writing data to CSV file: ${filePath}`);

      if (data.length === 0) {
        logger.warn('No data provided to write to CSV file');
        return;
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvLines = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => row[header] || '');
        csvLines.push(values.join(','));
      }

      const csvContent = csvLines.join('\n');
      fs.writeFileSync(filePath, csvContent, 'utf8');

      logger.info(`Successfully wrote ${data.length} rows to CSV file`);

    } catch (error: any) {
      logger.error(`Failed to write CSV file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Filter CSV data based on criteria
   * @param data - Data to filter
   * @param criteria - Filter criteria
   * @returns Filtered data
   */
  filterData(data: any[], criteria: Record<string, any>): any[] {
    return data.filter(row => {
      return Object.entries(criteria).every(([key, value]) => {
        return row[key] === value;
      });
    });
  }

  /**
   * Get random row from data
   * @param data - Data array
   * @returns Random row
   */
  getRandomRow(data: any[]): any {
    if (data.length === 0) {
      throw new Error('No data available to select random row');
    }
    
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  }
}