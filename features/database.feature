@database @integration
Feature: Database Connectivity and Testing
  As a test automation engineer
  I want to validate database operations across different database systems
  So that I can ensure data integrity and proper database interactions

  Background:
    Given I have database connections configured

  @smoke @database @connection
  Scenario: Database Connection Validation
    When I connect to all databases
    Then all database connections should be successful

  @database @mysql @connection
  Scenario: MySQL Database Connection
    When I connect to "mysql" database
    Then "mysql" database connection should be successful

  @database @mongodb @connection
  Scenario: MongoDB Database Connection
    When I connect to "mongodb" database
    Then "mongodb" database connection should be successful

  @database @postgresql @connection
  Scenario: PostgreSQL Database Connection
    When I connect to "postgresql" database
    Then "postgresql" database connection should be successful

  @database @crud @mysql
  Scenario: MySQL CRUD Operations
    When I connect to "mysql" database
    And I setup test data for "mysql" database
    And I execute a SELECT query on "mysql" database
    And I execute an INSERT query on "mysql" database
    And I execute an UPDATE query on "mysql" database
    Then the database operations should be successful
    And I should see data in all databases

  @database @crud @mongodb
  Scenario: MongoDB CRUD Operations
    When I connect to "mongodb" database
    And I setup test data for "mongodb" database
    And I execute a SELECT query on "mongodb" database
    And I execute an INSERT query on "mongodb" database
    And I execute an UPDATE query on "mongodb" database
    Then the database operations should be successful

  @database @crud @postgresql
  Scenario: PostgreSQL CRUD Operations
    When I connect to "postgresql" database
    And I setup test data for "postgresql" database
    And I execute a SELECT query on "postgresql" database
    And I execute an INSERT query on "postgresql" database
    And I execute an UPDATE query on "postgresql" database
    Then the database operations should be successful

  @database @transaction @mysql
  Scenario: MySQL Transaction Handling
    When I connect to "mysql" database
    And I setup test data for "mysql" database
    And I execute a transaction on "mysql" database
    Then the database operations should be successful

  @database @transaction @postgresql
  Scenario: PostgreSQL Transaction Handling
    When I connect to "postgresql" database
    And I setup test data for "postgresql" database
    And I execute a transaction on "postgresql" database
    Then the database operations should be successful

  @database @performance @all
  Scenario: Database Performance Validation
    When I connect to all databases
    And I setup test data for all databases
    And I execute a SELECT query on "mysql" database
    And I execute a SELECT query on "mongodb" database
    And I execute a SELECT query on "postgresql" database
    Then database operations should complete within 5 seconds

  @database @integration @full
  Scenario: Complete Database Integration Test
    When I connect to all databases
    And I setup test data for all databases
    And I execute a SELECT query on "mysql" database
    And I execute an INSERT query on "mysql" database
    And I execute a SELECT query on "mongodb" database
    And I execute an INSERT query on "mongodb" database
    And I execute a SELECT query on "postgresql" database
    And I execute an INSERT query on "postgresql" database
    Then the database operations should be successful
    And I should see data in all databases
    And database operations should complete within 10 seconds
    When I cleanup test data from all databases

  @database @stress @load
  Scenario Outline: Database Load Testing
    When I connect to "<database>" database
    And I setup test data for "<database>" database
    And I execute a SELECT query on "<database>" database
    And I execute an INSERT query on "<database>" database
    And I execute an UPDATE query on "<database>" database
    Then the database operations should be successful
    And database operations should complete within 3 seconds

    Examples:
      | database   |
      | mysql      |
      | mongodb    |
      | postgresql |

  @database @cleanup @maintenance
  Scenario: Database Cleanup and Maintenance
    When I connect to all databases
    And I setup test data for all databases
    Then I should see data in all databases
    When I cleanup test data from all databases
    Then the database operations should be successful
