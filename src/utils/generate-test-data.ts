import { ExcelDataHandler } from '../utils/data/excel-handler';
import * as path from 'path';

/**
 * Script to generate sample Excel data for testing
 */
async function generateExcelTestData() {
  const excelHandler = new ExcelDataHandler();
  
  const userRegistrationData = [
    {
      firstName: 'John',
      lastName: 'Doe', 
      email: 'john.doe@test.com',
      password: 'Password123!',
      age: 30,
      country: 'USA',
      subscribeNewsletter: true,
      testType: 'smoke'
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com', 
      password: 'SecurePass456',
      age: 25,
      country: 'UK',
      subscribeNewsletter: false,
      testType: 'regression'
    },
    {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@test.com',
      password: 'MyPassword789',
      age: 35,
      country: 'Canada',
      subscribeNewsletter: true,
      testType: 'smoke'  
    },
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@test.com',
      password: 'StrongPass321',
      age: 28,
      country: 'Australia',
      subscribeNewsletter: false,
      testType: 'negative'
    },
    {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie.brown@test.com',
      password: 'TestPass654',
      age: 42,
      country: 'Germany',
      subscribeNewsletter: true,
      testType: 'performance'
    }
  ];

  const productData = [
    {
      productName: 'MacBook Pro',
      category: 'Electronics',
      price: 1999.99,
      inStock: true,
      rating: 4.8,
      reviews: 1250,
      testType: 'smoke'
    },
    {
      productName: 'iPhone 15',
      category: 'Electronics', 
      price: 999.99,
      inStock: true,
      rating: 4.7,
      reviews: 2100,
      testType: 'regression'
    },
    {
      productName: 'Programming Book',
      category: 'Books',
      price: 49.99,
      inStock: false,
      rating: 4.5,
      reviews: 87,
      testType: 'negative'
    },
    {
      productName: 'Wireless Headphones', 
      category: 'Electronics',
      price: 299.99,
      inStock: true,
      rating: 4.6,
      reviews: 450,
      testType: 'smoke'
    },
    {
      productName: 'Coffee Mug',
      category: 'Home',
      price: 15.99,
      inStock: true,
      rating: 4.2,
      reviews: 25,
      testType: 'performance'
    }
  ];

  const comprehensiveTestData = [
    {
      testId: 'TC001',
      testName: 'User Login Smoke Test',
      testType: 'smoke',
      priority: 'High',
      module: 'Authentication',
      expectedResult: 'Pass',
      automationCandidate: true,
      estimatedTime: 5,
      tags: 'login,smoke,authentication'
    },
    {
      testId: 'TC002', 
      testName: 'Product Search Regression',
      testType: 'regression',
      priority: 'Medium',
      module: 'Search',
      expectedResult: 'Pass',
      automationCandidate: true,
      estimatedTime: 8,
      tags: 'search,regression,products'
    },
    {
      testId: 'TC003',
      testName: 'Invalid Payment Processing',
      testType: 'negative',
      priority: 'High', 
      module: 'Payment',
      expectedResult: 'Fail',
      automationCandidate: true,
      estimatedTime: 10,
      tags: 'payment,negative,validation'
    },
    {
      testId: 'TC004',
      testName: 'Load Testing Checkout',
      testType: 'performance',
      priority: 'Low',
      module: 'Checkout',
      expectedResult: 'Pass',
      automationCandidate: false,
      estimatedTime: 30,
      tags: 'checkout,performance,load'
    },
    {
      testId: 'TC005',
      testName: 'Security User Input Validation',
      testType: 'security',
      priority: 'Critical',
      module: 'Security',
      expectedResult: 'Pass',
      automationCandidate: true,
      estimatedTime: 15,
      tags: 'security,validation,input'
    }
  ];

  try {
    const excelPath = path.resolve('src/data/user-registration-data.xlsx');
    
    // Create workbook with multiple sheets
    await excelHandler.writeExcelFile(userRegistrationData, excelPath, 'UserData');
    await excelHandler.addSheet(excelPath, 'ProductData', productData);
    await excelHandler.addSheet(excelPath, 'TestCases', comprehensiveTestData);
    
    console.log('✅ Excel test data generated successfully');
    console.log(`📊 User Registration Data: ${userRegistrationData.length} records`);
    console.log(`📦 Product Data: ${productData.length} records`);
    console.log(`🧪 Test Cases: ${comprehensiveTestData.length} records`);
    console.log(`📁 File saved: ${excelPath}`);
    
  } catch (error) {
    console.error('❌ Failed to generate Excel test data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  generateExcelTestData().catch(console.error);
}

export { generateExcelTestData };