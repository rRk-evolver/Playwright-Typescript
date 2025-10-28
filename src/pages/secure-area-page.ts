import { Page, BrowserContext } from 'playwright';
import { BasePage } from './base-page';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

/**
 * SecureAreaPage class for The Internet Herokuapp secure area
 * URL: https://the-internet.herokuapp.com/secure
 */
export class SecureAreaPage extends BasePage {
  // Page selectors for The Internet Herokuapp secure area
  private readonly selectors = {
    // Main content
    pageHeading: 'h2',
    welcomeMessage: 'h4',
    logoutButton: 'a[href="/logout"]',
    flashMessage: '#flash',
    
    // Content area
    contentArea: '.example',
    mainContent: '#content'
  };

  constructor(page: Page, context: BrowserContext) {
    super(page, context);
  }

  /**
   * Navigate to The Internet Herokuapp secure area
   */
  async navigate(): Promise<void> {
    logger.step('Navigating to The Internet secure area');
    const secureUrl = process.env.BASE_URL?.replace('/todomvc', '') + '/secure' || 'https://the-internet.herokuapp.com/secure';
    
    await this.page.goto(secureUrl, { waitUntil: 'networkidle' });
    await this.waitForPageLoad();
  }

  /**
   * Verify we are on the secure area page
   */
  async verifySecureAreaPage(): Promise<void> {
    logger.step('Verifying secure area page elements');
    
    // Check URL
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/secure')) {
      throw new Error(`Expected secure area URL, but found: ${currentUrl}`);
    }

    // Check page heading
    await this.waitForElement(this.selectors.pageHeading);
    const heading = await this.getText(this.selectors.pageHeading);
    if (!heading.includes('Secure Area')) {
      throw new Error(`Expected 'Secure Area' heading, but found: ${heading}`);
    }

    // Check welcome message
    await this.waitForElement(this.selectors.welcomeMessage);
    const welcomeText = await this.getText(this.selectors.welcomeMessage);
    if (!welcomeText.includes('Welcome to the Secure Area')) {
      throw new Error(`Expected welcome message, but found: ${welcomeText}`);
    }

    // Check logout button is present
    await this.waitForElement(this.selectors.logoutButton);
    
    logger.info('Secure area page verification completed successfully');
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    logger.step('Getting welcome message');
    const welcomeText = await this.getText(this.selectors.welcomeMessage);
    logger.info(`Welcome message: ${welcomeText}`);
    return welcomeText;
  }

  /**
   * Get flash message (success message after login)
   */
  async getFlashMessage(): Promise<string> {
    logger.step('Getting flash message');
    
    if (await this.isVisible(this.selectors.flashMessage)) {
      const message = await this.getText(this.selectors.flashMessage);
      logger.info(`Flash message: ${message}`);
      return message.trim();
    }
    
    return '';
  }

  /**
   * Check if success message is displayed
   */
  async isSuccessMessageDisplayed(): Promise<boolean> {
    logger.step('Checking if success message is displayed');
    const isVisible = await this.isVisible(this.selectors.flashMessage);
    
    if (isVisible) {
      const message = await this.getText(this.selectors.flashMessage);
      return message.toLowerCase().includes('logged into a secure area');
    }
    
    return false;
  }

  /**
   * Click logout button
   */
  async logout(): Promise<void> {
    logger.step('Clicking logout button');
    await this.click(this.selectors.logoutButton);
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/login', { timeout: 10000 });
    
    logger.info('Logout completed successfully');
  }

  /**
   * Check if logout button is visible
   */
  async isLogoutButtonVisible(): Promise<boolean> {
    logger.step('Checking if logout button is visible');
    return await this.isVisible(this.selectors.logoutButton);
  }

  /**
   * Get page heading text
   */
  async getPageHeading(): Promise<string> {
    logger.step('Getting page heading');
    const heading = await this.getText(this.selectors.pageHeading);
    logger.info(`Page heading: ${heading}`);
    return heading;
  }

  /**
   * Check if user is authenticated (on secure area)
   */
  async isUserAuthenticated(): Promise<boolean> {
    logger.step('Checking if user is authenticated');
    
    const currentUrl = this.page.url();
    const isOnSecurePage = currentUrl.includes('/secure');
    const hasWelcomeMessage = await this.isVisible(this.selectors.welcomeMessage);
    const hasLogoutButton = await this.isVisible(this.selectors.logoutButton);
    
    const isAuthenticated = isOnSecurePage && hasWelcomeMessage && hasLogoutButton;
    logger.info(`User authentication status: ${isAuthenticated}`);
    
    return isAuthenticated;
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    logger.step('Waiting for secure area page to load completely');
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
    
    // Wait for essential elements
    await this.waitForElement(this.selectors.pageHeading);
    await this.waitForElement(this.selectors.welcomeMessage);
    await this.waitForElement(this.selectors.logoutButton);
    
    // Wait for any animations or dynamic content
    await this.page.waitForTimeout(500);
  }

  /**
   * Take screenshot of secure area page
   */
  async takeScreenshot(path?: string): Promise<Buffer> {
    const screenshotPath = path || `screenshots/secure-area-${Date.now()}.png`;
    logger.step(`Taking screenshot: ${screenshotPath}`);
    
    return await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
  }

  /**
   * Verify user has access to secure content
   */
  async verifySecureContent(): Promise<void> {
    logger.step('Verifying access to secure content');
    
    // Check that we're on the secure page
    await this.verifySecureAreaPage();
    
    // Check that success message is displayed
    const hasSuccessMessage = await this.isSuccessMessageDisplayed();
    if (!hasSuccessMessage) {
      logger.warn('Success message not found, but user appears to be authenticated');
    }
    
    // Verify logout functionality is available
    const canLogout = await this.isLogoutButtonVisible();
    if (!canLogout) {
      throw new Error('Logout button not available - user may not be properly authenticated');
    }
    
    logger.info('Secure content access verified successfully');
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if page contains specific text
   */
  async containsText(text: string): Promise<boolean> {
    logger.step(`Checking if page contains text: ${text}`);
    const pageContent = await this.page.textContent('body');
    return pageContent?.includes(text) || false;
  }
}