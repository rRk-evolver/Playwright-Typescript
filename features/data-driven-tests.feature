Feature: Data-Driven Testing Framework
  As a test automation engineer
  I want to run tests with data from multiple file formats
  So that I can validate different scenarios with various test data

  Background:
    Given the data handlers are initialized

  @data-driven @csv @smoke
  Scenario: Test login with CSV data
    Given I have test data from CSV file "src/data/login-test-data.csv"
    When I execute login tests for each CSV record
    Then all CSV-based login tests should pass
    And the test results should be recorded

  @data-driven @excel @smoke
  Scenario: Test user registration with Excel data
    Given I have test data from Excel file "src/data/user-registration-data.xlsx"
    And I read data from sheet "UserData"
    When I execute registration tests for each Excel record
    Then all Excel-based registration tests should pass
    And the results should be saved to Excel file

  @data-driven @json @smoke
  Scenario: Test product search with JSON data
    Given I have test data from JSON file "src/data/product-search-data.json"
    When I execute search tests for each JSON record
    Then all JSON-based search tests should pass
    And the test execution summary should be available

  @data-driven @combined @regression
  Scenario: Test checkout process with combined data sources
    Given I have login data from CSV file "src/data/login-test-data.csv"
    And I have product data from Excel file "src/data/product-data.xlsx"
    And I have payment data from JSON file "src/data/payment-methods.json"
    When I execute end-to-end checkout tests combining all data sources
    Then all combined data tests should pass
    And comprehensive test report should be generated

  @data-driven @validation @regression
  Scenario: Validate data file integrity
    Given I have multiple data files of different formats
    When I validate the structure of CSV file "src/data/login-test-data.csv"
    And I validate the structure of Excel file "src/data/user-registration-data.xlsx"
    And I validate the structure of JSON file "src/data/product-search-data.json"
    Then all data files should have valid structure
    And no data corruption should be detected

  @data-driven @random @smoke
  Scenario: Test with random data selection
    Given I have test data from multiple sources
    When I select random records from CSV file
    And I select random records from Excel file
    And I select random records from JSON file
    Then tests should execute with randomly selected data
    And results should vary between test runs

  @data-driven @filtering @regression
  Scenario: Test with filtered data
    Given I have comprehensive test data in Excel file "src/data/comprehensive-test-data.xlsx"
    When I filter data by criteria "testType=smoke"
    And I execute tests with filtered data
    Then only smoke test data should be used
    And test execution should be optimized

  @data-driven @encryption @security
  Scenario: Test with encrypted sensitive data
    Given I have encrypted test data in JSON file "src/data/secure-test-data.json"
    When I decrypt sensitive fields like "password" and "creditCard"
    And I execute tests with decrypted data
    Then sensitive data should be handled securely
    And no plain text sensitive data should be logged

  @data-driven @parallel @performance
  Scenario: Execute parallel tests with data distribution
    Given I have large dataset from CSV file "src/data/large-test-dataset.csv"
    When I distribute data across parallel test threads
    And I execute tests concurrently with distributed data
    Then test execution time should be optimized
    And all parallel tests should complete successfully

  @data-driven @cross-format @integration
  Scenario: Test data format conversion
    Given I have data in CSV format "src/data/source-data.csv"
    When I convert CSV data to Excel format
    And I convert Excel data to JSON format
    And I convert JSON data back to CSV format
    Then data integrity should be maintained across all conversions
    And no data loss should occur during format changes

  @data-driven @update @regression
  Scenario: Test data modification and persistence
    Given I have editable test data in Excel file "src/data/user-accounts.xlsx"
    When I update user account status in the data file
    And I execute tests with updated data
    Then tests should reflect the updated data values
    And changes should be persisted in the data file

  @data-driven @backup @reliability
  Scenario: Test data backup and recovery
    Given I have important test data files
    When I create backups of all data files
    And I simulate data corruption
    And I restore data from backups
    Then original data should be recovered successfully
    And test execution should continue normally
