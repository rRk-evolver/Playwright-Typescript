Feature: Simple Data-Driven Testing
  As a test automation engineer
  I want to validate data-driven testing capabilities
  So that I can ensure the framework handles various data formats

  Background:
    Given the data-driven framework is ready

  @data-driven @csv @smoke
  Scenario: Validate CSV data loading
    Given I load test data from CSV file "src/data/login-test-data.csv"
    Then the CSV data should be loaded successfully
    And the data should contain expected fields

  @data-driven @excel @smoke
  Scenario: Validate Excel data loading
    Given I load test data from Excel file "src/data/user-registration-data.xlsx"
    Then the Excel data should be loaded successfully
    And the data should contain user information

  @data-driven @json @smoke
  Scenario: Validate JSON data loading
    Given I load test data from JSON file "src/data/comprehensive-test-data.json"
    Then the JSON data should be loaded successfully
    And the data should contain test configuration

  @data-driven @validation @regression
  Scenario: Validate data format conversion
    Given I have CSV data loaded
    When I convert CSV data to JSON format
    Then the conversion should be successful
    And data integrity should be maintained

  @data-driven @filtering @regression
  Scenario: Validate data filtering capabilities
    Given I have Excel data with multiple test types
    When I filter data by test type "smoke"
    Then only smoke test records should be returned
    And the filtered data should be valid
