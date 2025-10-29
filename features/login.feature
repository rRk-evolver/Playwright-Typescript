Feature: User Authentication - The Internet Herokuapp
  As a user testing the demo application
  I want to login to The Internet Herokuapp
  So that I can access the secure area and verify authentication functionality

  Background:
    Given I navigate to "The Internet" login page

  @smoke @ui @demo
  Scenario: Successful login with valid demo credentials
    When I login with username "tomsmith" and password "SuperSecretPassword!"
    And I click the login button
    Then I should be logged in successfully
    And I should see the secure area page
    And I should see welcome message "Welcome to the Secure Area"

  @negative @ui @demo
  Scenario: Failed login with invalid credentials
    When I login with username "invaliduser" and password "wrongpassword"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "Your username is invalid!"

  @negative @ui @demo
  Scenario: Failed login with valid username but wrong password
    When I login with username "tomsmith" and password "wrongpassword"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "Your password is invalid!"

  @data-driven @ui @demo
  Scenario Outline: Login with different credential combinations
    When I login with username "<username>" and password "<password>"
    And I click the login button
    Then I should see "<expected_result>"
    And the page should show "<validation_message>"

    Examples:
      | username | password | expected_result | validation_message |
      | tomsmith | SuperSecretPassword! | success | Welcome to the Secure Area |
      | invaliduser | SuperSecretPassword! | error | Your username is invalid! |
      | tomsmith | wrongpassword | error | Your password is invalid! |
      | | | error | Your username is invalid! |

  @logout @ui @demo
  Scenario: Successful logout after login
    Given I login with valid demo credentials
    When I am on the secure area page
    And I click the logout button
    Then I should be redirected to login page
    And I should see logout success message "You logged out of the secure area!"

  @accessibility @ui @demo
  Scenario: Login page accessibility verification
    Given I navigate to "The Internet" login page
    Then the login page should be accessible
    And all form elements should have proper labels
    And the page should support keyboard navigation

  @security @ui @demo
  Scenario: Verify secure area protection
    Given I try to access secure area directly without login
    Then I should be redirected to login page
    And I should see message indicating authentication required

  @validation @ui @demo
  Scenario: Empty username validation
    Given I navigate to "The Internet" login page
    When I login with username "" and password "SuperSecretPassword!"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "Your username is invalid!"

  @validation @ui @demo
  Scenario: Empty password validation
    Given I navigate to "The Internet" login page
    When I login with username "tomsmith" and password ""
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "Your password is invalid!"

  @validation @ui @demo
  Scenario: Both fields empty validation
    Given I navigate to "The Internet" login page
    When I login with username "" and password ""
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "Your username is invalid!"

  @keyboard @ui @demo
  Scenario: Login using keyboard navigation only
    Given I navigate to "The Internet" login page
    When I navigate to username field using tab
    And I type "tomsmith" in focused field
    And I navigate to password field using tab
    And I type "SuperSecretPassword!" in focused field
    And I submit form using enter key
    Then I should be logged in successfully
    And I should see the secure area page

  @security @ui @demo
  Scenario: Multiple failed login attempts
    Given I navigate to "The Internet" login page
    When I attempt login with wrong credentials 3 times
    Then I should see consistent error messages
    And I should remain on the login page

  @session @ui @demo
  Scenario: Session persistence after successful login
    Given I navigate to "The Internet" login page
    When I login with username "tomsmith" and password "SuperSecretPassword!"
    And I click the login button
    And I should be logged in successfully
    When I refresh the page
    Then I should still be on the secure area page
    And I should see welcome message "Welcome to the Secure Area"

  @browser @ui @demo
  Scenario: Back button behavior after login
    Given I navigate to "The Internet" login page
    When I login with username "tomsmith" and password "SuperSecretPassword!"
    And I click the login button
    And I should be logged in successfully
    When I click browser back button
    Then I should remain on the secure area page

  @performance @ui @demo
  Scenario: Login page load performance
    Given I navigate to "The Internet" login page
    Then the page should load within 5 seconds
    And all essential elements should be visible
    And the page should be responsive

  @responsive @ui @demo
  Scenario: Mobile responsive login
    Given I am using a mobile device viewport
    When I navigate to "The Internet" login page
    Then the login form should be mobile-friendly
    And I should be able to login on mobile
    When I login with username "tomsmith" and password "SuperSecretPassword!"
    And I click the login button
    Then I should be logged in successfully on mobile

  @data-driven @ui @demo
  Scenario Outline: Login with various invalid credential patterns
    Given I navigate to "The Internet" login page
    When I login with username "<username>" and password "<password>"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the error should contain "<expected_error>"

    Examples:
      | username     | password              | expected_error               |
      | invaliduser  | SuperSecretPassword!  | Your username is invalid!    |
      | tomsmith     | wrongpassword         | Your password is invalid!    |
      | TOMSMITH     | SuperSecretPassword!  | Your username is invalid!    |
      | tomsmith     | SUPERSECRETPASSWORD!  | Your password is invalid!    |
      | tom smith    | SuperSecretPassword!  | Your username is invalid!    |
      | tomsmith123  | SuperSecretPassword!  | Your username is invalid!    |

  @sql-injection @security @demo
  Scenario: SQL injection protection
    Given I navigate to "The Internet" login page
    When I login with username "admin' OR '1'='1" and password "password"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And the application should handle malicious input safely

  @xss @security @demo
  Scenario: XSS protection in login form
    Given I navigate to "The Internet" login page
    When I login with username "<script>alert('xss')</script>" and password "password"
    And I click the login button
    Then I should see login error message
    And I should remain on the login page
    And no script should be executed

  @timeout @ui @demo
  Scenario: Form field character limits
    Given I navigate to "The Internet" login page
    When I enter very long username "a" repeated 1000 times
    And I enter very long password "b" repeated 1000 times
    And I click the login button
    Then the form should handle long input gracefully
    And I should see appropriate validation message
