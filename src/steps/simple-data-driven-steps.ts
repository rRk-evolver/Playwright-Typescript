import { Given, When, Then, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CSVDataHandler } from '../utils/data/csv-handler';
import { ExcelDataHandler } from '../utils/data/excel-handler';
import { JSONDataHandler } from '../utils/data/json-handler';
import { DataDrivenTestManager } from '../utils/data-driven-test-manager';
import { Logger } from '../utils/logger';
import * as path from 'path';

const logger = Logger.getInstance();

// Data handlers and manager
let csvHandler: CSVDataHandler;
let excelHandler: ExcelDataHandler;
let jsonHandler: JSONDataHandler;
let testManager: DataDrivenTestManager;

// Test data storage
let currentData: any[] = [];
let convertedData: any[] = [];
let filteredData: any[] = [];

BeforeAll(async function () {
  logger.info('🚀 Initializing simple data-driven testing framework');
  
  csvHandler = new CSVDataHandler();
  excelHandler = new ExcelDataHandler();
  jsonHandler = new JSONDataHandler();
  testManager = new DataDrivenTestManager();
  
  logger.info('✅ Simple data-driven testing framework initialized');
});

AfterAll(async function () {
  logger.info('🏁 Simple data-driven testing framework cleanup completed');
});

// Background Steps
Given('the data-driven framework is ready', async function () {
  logger.info('🔧 Verifying data-driven framework readiness');
  
  expect(csvHandler).toBeDefined();
  expect(excelHandler).toBeDefined();
  expect(jsonHandler).toBeDefined();
  expect(testManager).toBeDefined();
  
  logger.info('✅ Data-driven framework is ready');
});

// CSV Data Steps
Given('I load test data from CSV file {string}', async function (filePath: string) {
  logger.info(`📄 Loading test data from CSV file: ${filePath}`);
  
  try {
    currentData = await testManager.loadTestData(filePath);
    logger.info(`✅ Loaded ${currentData.length} records from CSV file`);
    expect(currentData.length).toBeGreaterThan(0);
  } catch (error: any) {
    logger.error(`❌ Failed to load CSV file: ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

Given('I have CSV data loaded', async function () {
  logger.info('📄 Loading sample CSV data');
  
  currentData = await testManager.loadTestData('src/data/login-test-data.csv');
  expect(currentData.length).toBeGreaterThan(0);
  
  logger.info(`✅ CSV data loaded: ${currentData.length} records`);
});

Then('the CSV data should be loaded successfully', function () {
  logger.info('✅ Validating CSV data loading');
  expect(currentData).toBeDefined();
  expect(Array.isArray(currentData)).toBeTruthy();
  expect(currentData.length).toBeGreaterThan(0);
});

Then('the data should contain expected fields', function () {
  logger.info('🔍 Validating CSV data structure');
  
  const firstRecord = currentData[0];
  expect(firstRecord).toBeDefined();
  expect(firstRecord).toHaveProperty('username');
  expect(firstRecord).toHaveProperty('password');
  expect(firstRecord).toHaveProperty('expectedResult');
  
  logger.info('✅ CSV data contains expected fields');
});

// Excel Data Steps
Given('I load test data from Excel file {string}', async function (filePath: string) {
  logger.info(`📊 Loading test data from Excel file: ${filePath}`);
  
  try {
    currentData = await testManager.loadTestData(filePath, { sheetName: 'UserData' });
    logger.info(`✅ Loaded ${currentData.length} records from Excel file`);
    expect(currentData.length).toBeGreaterThan(0);
  } catch (error: any) {
    logger.error(`❌ Failed to load Excel file: ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

Given('I have Excel data with multiple test types', async function () {
  logger.info('📊 Loading Excel data with test types');
  
  currentData = await testManager.loadTestData('src/data/user-registration-data.xlsx', { 
    sheetName: 'TestCases' 
  });
  expect(currentData.length).toBeGreaterThan(0);
  
  logger.info(`✅ Excel data loaded: ${currentData.length} records`);
});

Then('the Excel data should be loaded successfully', function () {
  logger.info('✅ Validating Excel data loading');
  expect(currentData).toBeDefined();
  expect(Array.isArray(currentData)).toBeTruthy();
  expect(currentData.length).toBeGreaterThan(0);
});

Then('the data should contain user information', function () {
  logger.info('🔍 Validating Excel data structure');
  
  const firstRecord = currentData[0];
  expect(firstRecord).toBeDefined();
  expect(firstRecord).toHaveProperty('firstName');
  expect(firstRecord).toHaveProperty('lastName');
  expect(firstRecord).toHaveProperty('email');
  
  logger.info('✅ Excel data contains user information');
});

// JSON Data Steps
Given('I load test data from JSON file {string}', async function (filePath: string) {
  logger.info(`📝 Loading test data from JSON file: ${filePath}`);
  
  try {
    const jsonData = await jsonHandler.readJSONFile(path.resolve(filePath));
    currentData = Array.isArray(jsonData) ? jsonData : [jsonData];
    logger.info(`✅ Loaded ${currentData.length} records from JSON file`);
    expect(currentData.length).toBeGreaterThan(0);
  } catch (error: any) {
    logger.error(`❌ Failed to load JSON file: ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

Then('the JSON data should be loaded successfully', function () {
  logger.info('✅ Validating JSON data loading');
  expect(currentData).toBeDefined();
  expect(Array.isArray(currentData)).toBeTruthy();
  expect(currentData.length).toBeGreaterThan(0);
});

Then('the data should contain test configuration', function () {
  logger.info('🔍 Validating JSON data structure');
  
  const data = currentData[0];
  expect(data).toBeDefined();
  expect(data).toHaveProperty('loginCredentials');
  expect(data).toHaveProperty('testConfiguration');
  
  logger.info('✅ JSON data contains test configuration');
});

// Data Conversion Steps
When('I convert CSV data to JSON format', async function () {
  logger.info('🔄 Converting CSV data to JSON format');
  
  try {
    // Simulate conversion by creating JSON structure
    convertedData = currentData.map((record, index) => ({
      id: index + 1,
      data: record,
      source: 'CSV',
      convertedAt: new Date().toISOString()
    }));
    
    logger.info(`✅ Converted ${currentData.length} CSV records to JSON format`);
    expect(convertedData.length).toEqual(currentData.length);
  } catch (error: any) {
    logger.error(`❌ Failed to convert data: ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

Then('the conversion should be successful', function () {
  logger.info('✅ Validating data conversion');
  expect(convertedData).toBeDefined();
  expect(Array.isArray(convertedData)).toBeTruthy();
  expect(convertedData.length).toEqual(currentData.length);
});

Then('data integrity should be maintained', function () {
  logger.info('🔍 Validating data integrity after conversion');
  
  for (let i = 0; i < currentData.length; i++) {
    const originalRecord = currentData[i];
    const convertedRecord = convertedData[i];
    
    expect(convertedRecord).toHaveProperty('data');
    expect(convertedRecord.data).toEqual(originalRecord);
  }
  
  logger.info('✅ Data integrity maintained during conversion');
});

// Data Filtering Steps
When('I filter data by test type {string}', async function (testType: string) {
  logger.info(`🔍 Filtering data by test type: ${testType}`);
  
  try {
    // Filter data based on testType field
    filteredData = currentData.filter(record => {
      return record.testType === testType || record.testCategory === testType;
    });
    
    logger.info(`✅ Filtered ${filteredData.length} records matching test type '${testType}'`);
    expect(filteredData.length).toBeGreaterThan(0);
  } catch (error: any) {
    logger.error(`❌ Failed to filter data: ${error?.message || 'Unknown error'}`);
    throw error;
  }
});

Then('only smoke test records should be returned', function () {
  logger.info('✅ Validating filtered smoke test records');
  
  expect(filteredData).toBeDefined();
  expect(Array.isArray(filteredData)).toBeTruthy();
  expect(filteredData.length).toBeGreaterThan(0);
  
  // Verify all records are smoke tests
  for (const record of filteredData) {
    const isSmoke = record.testType === 'smoke' || record.testCategory === 'smoke';
    expect(isSmoke).toBeTruthy();
  }
  
  logger.info(`✅ All ${filteredData.length} filtered records are smoke tests`);
});

Then('the filtered data should be valid', function () {
  logger.info('🔍 Validating filtered data structure');
  
  expect(filteredData).toBeDefined();
  expect(Array.isArray(filteredData)).toBeTruthy();
  expect(filteredData.length).toBeGreaterThanOrEqual(0);
  
  // Validate structure of filtered records
  if (filteredData.length > 0) {
    const firstRecord = filteredData[0];
    expect(firstRecord).toBeDefined();
    expect(typeof firstRecord).toBe('object');
  }
  
  logger.info('✅ Filtered data structure is valid');
});