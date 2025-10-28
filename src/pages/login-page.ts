import { Page, BrowserContext, Locator } from 'playwright';
import { BasePage } from './base-page';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

/**
 * LoginPage class for The Internet Herokuapp login functionality
 * URL: https://the-internet.herokuapp.com/login
 */
export class LoginPage extends BasePage {
  // Page selectors for The Internet Herokuapp
  private readonly selectors = {
    // Form elements
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: 'button[type="submit"]',
    loginForm: '#login',
    
    // Messages and content
    pageHeading: 'h2',
    flashMessage: '#flash',
    loginLink: 'a[href="/login"]',
    
    // Labels and text
    usernameLabel: 'label[for="username"]',
    passwordLabel: 'label[for="password"]',
    subheading: 'h4.subheader'
  };

  constructor(page: Page, context: BrowserContext) {
    super(page, context);
  }

  /**
   * Navigate to The Internet Herokuapp login page
   */
  async navigate(): Promise<void> {
    logger.step('Navigating to The Internet login page');
    const loginUrl = process.env.LOGIN_URL || 'https://the-internet.herokuapp.com/login';
    
    await this.page.goto(loginUrl, { waitUntil: 'networkidle' });
    await this.waitForPageLoad();
    
    // Verify we're on the correct page
    await this.verifyPageElements();
  }

  /**
   * Verify essential page elements are present
   */
  async verifyPageElements(): Promise<void> {
    logger.step('Verifying login page elements');
    
    // Check page heading
    await this.waitForElement(this.selectors.pageHeading);
    const heading = await this.getText(this.selectors.pageHeading);
    if (!heading.includes('Login Page')) {
      throw new Error(`Expected 'Login Page' heading, but found: ${heading}`);
    }

    // Check form elements
    await this.waitForElement(this.selectors.usernameInput);
    await this.waitForElement(this.selectors.passwordInput);
    await this.waitForElement(this.selectors.loginButton);
    
    // Check labels are present
    await this.waitForElement(this.selectors.usernameLabel);
    await this.waitForElement(this.selectors.passwordLabel);
    
    logger.info('All login page elements verified successfully');
  }

  /**
   * Enter username in the username field
   */
  async enterUsername(username: string): Promise<void> {
    logger.step(`Entering username: ${username}`);
    await this.clearAndType(this.selectors.usernameInput, username);
  }

  /**
   * Enter password in the password field
   */
  async enterPassword(password: string): Promise<void> {
    logger.step('Entering password');
    await this.clearAndType(this.selectors.passwordInput, password);
  }

  /**
   * Click the login button
   */
  async clickLoginButton(): Promise<void> {
    logger.step('Clicking login button');
    await this.click(this.selectors.loginButton);
    
    // Wait for either success (redirect to /secure) or error message
    await Promise.race([
      this.page.waitForURL('**/secure', { timeout: 10000 }),
      this.waitForElement(this.selectors.flashMessage, { timeout: 10000 })
    ]);
  }

  /**
   * Perform complete login with credentials
   */
  async login(username: string, password: string): Promise<void> {
    logger.step(`Performing login for user: ${username}`);
    
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
    
    // Wait for login completion
    await this.waitForLoginCompletion();
  }

  /**
   * Wait for login process to complete (either success or failure)
   */
  async waitForLoginCompletion(): Promise<void> {
    logger.step('Waiting for login completion');
    
    try {
      // Wait for either successful redirect or error message
      await Promise.race([
        this.page.waitForURL('**/secure', { timeout: 10000 }),
        this.waitForElement(this.selectors.flashMessage, { timeout: 10000 })
      ]);
      
      // Add small delay to ensure page is fully loaded
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      logger.error('Login completion timeout', error);
      throw new Error('Login process did not complete within expected time');
    }
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormDisplayed(): Promise<boolean> {
    logger.step('Checking if login form is displayed');
    return await this.isVisible(this.selectors.loginForm);
  }

  /**
   * Check if error message is displayed
   */
  async isErrorMessageDisplayed(): Promise<boolean> {
    logger.step('Checking if error message is displayed');
    const isVisible = await this.isVisible(this.selectors.flashMessage);
    
    if (isVisible) {
      const message = await this.getText(this.selectors.flashMessage);
      return message.toLowerCase().includes('invalid') || 
             message.toLowerCase().includes('incorrect') ||
             message.toLowerCase().includes('wrong');
    }
    
    return false;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    logger.step('Getting error message text');
    
    if (await this.isVisible(this.selectors.flashMessage)) {
      const message = await this.getText(this.selectors.flashMessage);
      logger.info(`Error message: ${message}`);
      return message.trim();
    }
    
    return '';
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    logger.step('Getting success message text');
    
    if (await this.isVisible(this.selectors.flashMessage)) {
      const message = await this.getText(this.selectors.flashMessage);
      logger.info(`Success message: ${message}`);
      return message.trim();
    }
    
    return '';
  }

  /**
   * Clear all form fields
   */
  async clearAllFields(): Promise<void> {
    logger.step('Clearing all form fields');
    await this.clear(this.selectors.usernameInput);
    await this.clear(this.selectors.passwordInput);
  }

  /**
   * Get current page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Verify URL matches expected pattern
   */
  async verifyUrl(pattern: RegExp): Promise<void> {
    logger.step(`Verifying URL matches pattern: ${pattern}`);
    const currentUrl = this.page.url();
    
    if (!pattern.test(currentUrl)) {
      throw new Error(`URL verification failed. Expected pattern: ${pattern}, Actual URL: ${currentUrl}`);
    }
    
    logger.info(`URL verification passed: ${currentUrl}`);
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    logger.step('Checking if login button is enabled');
    return await this.isEnabled(this.selectors.loginButton);
  }

  /**
   * Get username field value
   */
  async getUsernameValue(): Promise<string> {
    return await this.getValue(this.selectors.usernameInput);
  }

  /**
   * Get password field value
   */
  async getPasswordValue(): Promise<string> {
    return await this.getValue(this.selectors.passwordInput);
  }

  /**
   * Check if username field is focused
   */
  async isUsernameFieldFocused(): Promise<boolean> {
    const focused = await this.page.locator(this.selectors.usernameInput);
    return await focused.evaluate(el => document.activeElement === el);
  }

  /**
   * Check if password field is focused
   */
  async isPasswordFieldFocused(): Promise<boolean> {
    const focused = await this.page.locator(this.selectors.passwordInput);
    return await focused.evaluate(el => document.activeElement === el);
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    logger.step('Submitting login form with Enter key');
    await this.page.keyboard.press('Enter');
    await this.waitForLoginCompletion();
  }

  /**
   * Focus on username field
   */
  async focusUsernameField(): Promise<void> {
    logger.step('Focusing on username field');
    await this.page.locator(this.selectors.usernameInput).focus();
  }

  /**
   * Focus on password field
   */
  async focusPasswordField(): Promise<void> {
    logger.step('Focusing on password field');
    await this.page.locator(this.selectors.passwordInput).focus();
  }

  /**
   * Navigate using tab key
   */
  async navigateWithTab(): Promise<void> {
    logger.step('Navigating with Tab key');
    await this.page.keyboard.press('Tab');
  }

  /**
   * Check if page has proper accessibility features
   */
  async checkAccessibility(): Promise<{
    hasLabels: boolean;
    hasHeadings: boolean;
    hasProperTabOrder: boolean;
  }> {
    logger.step('Checking page accessibility features');
    
    const hasUsernameLabel = await this.isVisible(this.selectors.usernameLabel);
    const hasPasswordLabel = await this.isVisible(this.selectors.passwordLabel);
    const hasHeadings = await this.isVisible(this.selectors.pageHeading);
    
    // Test tab order
    await this.focusUsernameField();
    const usernameHasFocus = await this.isUsernameFieldFocused();
    
    await this.navigateWithTab();
    const passwordHasFocus = await this.isPasswordFieldFocused();
    
    return {
      hasLabels: hasUsernameLabel && hasPasswordLabel,
      hasHeadings,
      hasProperTabOrder: usernameHasFocus && passwordHasFocus
    };
  }

  /**
   * Take screenshot of login page
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    const screenshotPath = path || `screenshots/login-page-${Date.now()}.png`;
    logger.step(`Taking screenshot: ${screenshotPath}`);
    
    return await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
  }

  /**
   * Wait for page to be fully loaded
   */
  private async waitForPageLoad(): Promise<void> {
    logger.step('Waiting for login page to load completely');
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
    
    // Wait for essential elements
    await this.waitForElement(this.selectors.pageHeading);
    await this.waitForElement(this.selectors.loginForm);
    
    // Wait for any animations or dynamic content
    await this.page.waitForTimeout(500);
  }
}