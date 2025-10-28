import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Dashboard Page Object
 * Represents the dashboard page and its interactions
 */
export class DashboardPage extends BasePage {
  // Page URL
  private readonly url = '/dashboard';

  // Locators
  private readonly selectors = {
    welcomeMessage: '.welcome-message, [data-testid="welcome"], h1:has-text("Welcome")',
    userProfile: '.user-profile, [data-testid="user-profile"]',
    navigationMenu: '.nav-menu, [data-testid="navigation"]',
    logoutButton: '.logout-btn, [data-testid="logout"], button:has-text("Logout")',
    dashboardTitle: 'h1, .page-title, [data-testid="page-title"]',
    notificationBell: '.notification-bell, [data-testid="notifications"]',
    searchBox: '.search-box, [data-testid="search"], input[placeholder*="Search"]',
    mainContent: '.main-content, [data-testid="main-content"], main',
    sidebar: '.sidebar, [data-testid="sidebar"]',
    breadcrumb: '.breadcrumb, [data-testid="breadcrumb"]',
    quickActions: '.quick-actions, [data-testid="quick-actions"]',
    statisticsWidgets: '.stats-widget, [data-testid="stats-widget"]',
    recentActivity: '.recent-activity, [data-testid="recent-activity"]'
  };

  constructor(page: Page, context: BrowserContext) {
    super(page, context);
  }

  /**
   * Navigate to dashboard page
   */
  async navigate(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Verify welcome message is displayed
   */
  async verifyWelcomeMessage(): Promise<void> {
    await this.verifyElementVisible(this.selectors.welcomeMessage);
  }

  /**
   * Get welcome message text
   */
  async getWelcomeText(): Promise<string> {
    return await this.getText(this.selectors.welcomeMessage);
  }

  /**
   * Click logout button
   */
  async logout(): Promise<void> {
    await this.click(this.selectors.logoutButton);
  }

  /**
   * Check if user is logged in (dashboard is displayed)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.selectors.dashboardTitle);
  }

  /**
   * Get dashboard title
   */
  async getDashboardTitle(): Promise<string> {
    return await this.getText(this.selectors.dashboardTitle);
  }

  /**
   * Search for content
   * @param searchTerm - Term to search for
   */
  async search(searchTerm: string): Promise<void> {
    await this.type(this.selectors.searchBox, searchTerm, { clear: true });
    await this.page.keyboard.press('Enter');
  }

  /**
   * Click on notification bell
   */
  async openNotifications(): Promise<void> {
    await this.click(this.selectors.notificationBell);
  }

  /**
   * Check if notifications bell is visible
   */
  async hasNotifications(): Promise<boolean> {
    return await this.isVisible(this.selectors.notificationBell);
  }

  /**
   * Get user profile information
   */
  async getUserProfileInfo(): Promise<string> {
    return await this.getText(this.selectors.userProfile);
  }

  /**
   * Navigate using main menu
   * @param menuItem - Menu item to click
   */
  async navigateToMenuItem(menuItem: string): Promise<void> {
    const menuSelector = `${this.selectors.navigationMenu} a:has-text("${menuItem}"), ${this.selectors.navigationMenu} button:has-text("${menuItem}")`;
    await this.click(menuSelector);
  }

  /**
   * Check if main content is loaded
   */
  async isMainContentLoaded(): Promise<boolean> {
    return await this.isVisible(this.selectors.mainContent);
  }

  /**
   * Get statistics from widgets
   */
  async getStatistics(): Promise<Array<{ title: string; value: string }>> {
    const widgets = await this.page.locator(this.selectors.statisticsWidgets).all();
    const stats: Array<{ title: string; value: string }> = [];

    for (const widget of widgets) {
      try {
        const title = await widget.locator('.title, .stat-title, h3, h4').textContent() || '';
        const value = await widget.locator('.value, .stat-value, .number').textContent() || '';
        stats.push({ title: title.trim(), value: value.trim() });
      } catch (error) {
        // Skip widgets that don't have the expected structure
        continue;
      }
    }

    return stats;
  }

  /**
   * Get recent activity items
   */
  async getRecentActivity(): Promise<string[]> {
    const activities = await this.page.locator(`${this.selectors.recentActivity} li, ${this.selectors.recentActivity} .activity-item`).all();
    const activityTexts: string[] = [];

    for (const activity of activities) {
      const text = await activity.textContent();
      if (text) {
        activityTexts.push(text.trim());
      }
    }

    return activityTexts;
  }

  /**
   * Click on quick action button
   * @param actionName - Name of the action
   */
  async clickQuickAction(actionName: string): Promise<void> {
    const actionSelector = `${this.selectors.quickActions} button:has-text("${actionName}"), ${this.selectors.quickActions} a:has-text("${actionName}")`;
    await this.click(actionSelector);
  }

  /**
   * Verify dashboard page elements are present
   */
  async verifyPageElements(): Promise<void> {
    await this.verifyElementVisible(this.selectors.dashboardTitle);
    await this.verifyElementVisible(this.selectors.mainContent);
    
    // Optional elements (may not be present on all dashboards)
    const optionalElements = [
      this.selectors.navigationMenu,
      this.selectors.userProfile,
      this.selectors.searchBox
    ];

    for (const selector of optionalElements) {
      const isVisible = await this.isVisible(selector, 2000);
      if (isVisible) {
        logger.debug(`Optional element found: ${selector}`);
      }
    }
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardLoad(): Promise<void> {
    // Wait for main elements to be visible
    await this.waitForElement(this.selectors.dashboardTitle);
    await this.waitForElement(this.selectors.mainContent);
    
    // Wait for any loading spinners to disappear
    try {
      await this.page.waitForSelector('.loading, .spinner', { state: 'hidden', timeout: 5000 });
    } catch {
      // Loading spinner might not exist, continue
    }
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get breadcrumb navigation
   */
  async getBreadcrumb(): Promise<string[]> {
    const breadcrumbItems = await this.page.locator(`${this.selectors.breadcrumb} a, ${this.selectors.breadcrumb} span`).all();
    const breadcrumbTexts: string[] = [];

    for (const item of breadcrumbItems) {
      const text = await item.textContent();
      if (text && text.trim() !== '>') {
        breadcrumbTexts.push(text.trim());
      }
    }

    return breadcrumbTexts;
  }

  /**
   * Check if sidebar is expanded
   */
  async isSidebarExpanded(): Promise<boolean> {
    const sidebar = this.page.locator(this.selectors.sidebar);
    
    // Check for common expanded state indicators
    const hasExpandedClass = await sidebar.evaluate(el => 
      el.classList.contains('expanded') || 
      el.classList.contains('open') || 
      !el.classList.contains('collapsed')
    );

    // Also check width as a fallback
    const boundingBox = await sidebar.boundingBox();
    const isWideEnough = boundingBox ? boundingBox.width > 200 : false;

    return hasExpandedClass || isWideEnough;
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar(): Promise<void> {
    const toggleButton = '.sidebar-toggle, .menu-toggle, [data-testid="sidebar-toggle"]';
    if (await this.isVisible(toggleButton)) {
      await this.click(toggleButton);
    } else {
      // Try clicking on hamburger menu or similar
      const hamburgerMenu = '.hamburger, .menu-icon, ☰';
      await this.click(hamburgerMenu);
    }
  }

  /**
   * Verify user has appropriate permissions/access
   * @param expectedElements - Array of elements that should be visible for this user
   */
  async verifyUserAccess(expectedElements: string[]): Promise<void> {
    for (const element of expectedElements) {
      const isVisible = await this.isVisible(element, 3000);
      if (!isVisible) {
        throw new Error(`Expected element not found for user access: ${element}`);
      }
    }
    
    logger.info(`Verified user has access to ${expectedElements.length} expected elements`);
  }

  /**
   * Get dashboard performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    loadTime: number;
    domElements: number;
    networkRequests: number;
  }> {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domElements = document.querySelectorAll('*').length;
      
      return {
        loadTime: Math.round(loadTime),
        domElements,
        networkRequests: performance.getEntriesByType('resource').length
      };
    });

    logger.info('Dashboard performance metrics:', performanceMetrics);
    return performanceMetrics;
  }

  /**
   * Take full page screenshot of dashboard
   */
  async takeFullScreenshot(filename?: string): Promise<string> {
    const screenshotName = filename || `dashboard-${Date.now()}.png`;
    return await this.takeScreenshot(screenshotName);
  }
}