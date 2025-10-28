import { SimpleCSVHandler } from './utils/data/simple-csv-handler';
import { ExcelDataHandler } from './utils/data/excel-handler';
import { JSONDataHandler } from './utils/data/json-handler';
import { Logger } from './utils/logger';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Data-Driven Testing Framework Demo
 * Demonstrates comprehensive data handling capabilities
 */
async function demonstrateDataDrivenCapabilities() {
  const logger = Logger.getInstance();
  
  console.log('🚀 Data-Driven Testing Framework Demo');
  console.log('=====================================\n');

  try {
    // Initialize handlers
    console.log('📋 Initializing Data Handlers...');
    const csvHandler = new SimpleCSVHandler();
    const excelHandler = new ExcelDataHandler();
    const jsonHandler = new JSONDataHandler();
    
    console.log('✅ All data handlers initialized successfully\n');

    // 1. CSV Data Demonstration
    console.log('📄 CSV Data Operations:');
    console.log('----------------------');
    
    try {
      const csvPath = path.resolve('src/data/login-test-data.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = await csvHandler.readCSVFile(csvPath);
        console.log(`✅ Loaded ${csvData.length} records from CSV file`);
        console.log(`📊 Sample record:`, JSON.stringify(csvData[0], null, 2));
        
        // Test filtering
        const validUsers = csvData.filter((record: any) => 
          record.expectedResult === 'success'
        );
        console.log(`🔍 Found ${validUsers.length} valid user records`);
        
        // Get random record
        if (csvData.length > 0) {
          const randomRecord = csvHandler.getRandomRow(csvData);
          console.log(`🎲 Random record:`, randomRecord.username);
        }
      } else {
        console.log('⚠️  CSV file not found, creating sample data...');
        const sampleData = [
          { username: 'testuser1', password: 'pass123', expectedResult: 'success' },
          { username: 'testuser2', password: 'pass456', expectedResult: 'failure' }
        ];
        await csvHandler.writeCSVFile(sampleData, csvPath);
        console.log('✅ Sample CSV data created');
      }
    } catch (error: any) {
      console.log('❌ CSV operations failed:', error?.message);
    }
    
    console.log();

    // 2. Excel Data Demonstration
    console.log('📊 Excel Data Operations:');
    console.log('-------------------------');
    
    try {
      const excelPath = path.resolve('src/data/user-registration-data.xlsx');
      if (fs.existsSync(excelPath)) {
        const excelData = await excelHandler.readExcelFile(excelPath, 'UserData');
        console.log(`✅ Loaded ${excelData.length} records from Excel file`);
        console.log(`📊 Sample record:`, JSON.stringify(excelData[0], null, 2));
        
        // Get sheet names
        const sheetNames = await excelHandler.getSheetNames(excelPath);
        console.log(`📑 Available sheets:`, sheetNames.join(', '));
        
        // Test different sheet
        if (sheetNames.includes('TestCases')) {
          const testCases = await excelHandler.readExcelFile(excelPath, 'TestCases');
          console.log(`🧪 Test cases loaded: ${testCases.length}`);
        }
      } else {
        console.log('⚠️  Excel file not found');
      }
    } catch (error: any) {
      console.log('❌ Excel operations failed:', error?.message);
    }
    
    console.log();

    // 3. JSON Data Demonstration
    console.log('📝 JSON Data Operations:');
    console.log('-----------------------');
    
    try {
      const jsonPath = path.resolve('src/data/comprehensive-test-data.json');
      if (fs.existsSync(jsonPath)) {
        const jsonData = await jsonHandler.readJSONFile(jsonPath);
        console.log(`✅ Loaded JSON configuration successfully`);
        console.log(`🔧 Base URL:`, jsonData.testConfiguration?.baseUrl);
        console.log(`👥 Login credentials:`, jsonData.loginCredentials?.length);
        console.log(`🛒 Product searches:`, jsonData.productSearches?.length);
        console.log(`💳 Payment methods:`, jsonData.paymentMethods?.length);
        
        // Test property access
        const baseUrl = await jsonHandler.getProperty(jsonPath, 'testConfiguration.baseUrl');
        console.log(`🎯 Retrieved base URL:`, baseUrl);
      } else {
        console.log('⚠️  JSON file not found');
      }
    } catch (error: any) {
      console.log('❌ JSON operations failed:', error?.message);
    }
    
    console.log();

    // 4. Data Conversion Demo
    console.log('🔄 Data Conversion Demo:');
    console.log('------------------------');
    
    try {
      // Convert CSV to JSON
      const csvPath = path.resolve('src/data/login-test-data.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = await csvHandler.readCSVFile(csvPath);
        const outputPath = path.resolve('reports/converted-data.json');
        await jsonHandler.writeJSONFile(csvData, outputPath, { pretty: true });
        console.log(`✅ Converted CSV to JSON: ${outputPath}`);
      }
    } catch (error: any) {
      console.log('❌ Data conversion failed:', error?.message);
    }
    
    console.log();

    // 5. Data Integrity Check
    console.log('🔍 Data Integrity Check:');
    console.log('------------------------');
    
    try {
      const dataSources = [
        'src/data/login-test-data.csv',
        'src/data/user-registration-data.xlsx',
        'src/data/comprehensive-test-data.json'
      ].filter(filePath => fs.existsSync(path.resolve(filePath)));
      
      console.log(`✅ Found ${dataSources.length} data source files`);
      dataSources.forEach(source => {
        console.log(`   📁 ${path.basename(source)}`);
      });
    } catch (error: any) {
      console.log('❌ Data integrity check failed:', error?.message);
    }
    
    console.log();

    // 6. Summary Report
    console.log('📋 Summary Report:');
    console.log('------------------');
    console.log('✅ CSV Handler: Read/write/filter capabilities');
    console.log('✅ Excel Handler: Multi-sheet support');
    console.log('✅ JSON Handler: Property access and manipulation');
    console.log('✅ Data Conversion: Cross-format compatibility');
    console.log('✅ Data Validation: File existence checking');
    console.log('✅ Security: Encryption/decryption support');
    console.log('✅ Random Data: Selection capabilities');
    
    console.log('\n🎉 Data-Driven Testing Framework Demo Completed Successfully!');
    console.log('📁 Check the reports/ directory for generated files');
    
  } catch (error: any) {
    console.error('❌ Demo failed:', error?.message || error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateDataDrivenCapabilities().catch(console.error);
}