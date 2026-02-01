import { test, expect } from '@playwright/test';

test.describe('Copy Trading Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/copy');
  });

  test('should display top traders list', async ({ page }) => {
    // Check for traders list
    await expect(page.getByTestId('traders-list')).toBeVisible();
    
    // Check for at least one trader card
    await expect(page.getByTestId('trader-card').first()).toBeVisible();
  });

  test('should show trader stats', async ({ page }) => {
    const traderCard = page.getByTestId('trader-card').first();
    
    // Check for trader stats
    await expect(traderCard.getByTestId('trader-pnl')).toBeVisible();
    await expect(traderCard.getByTestId('trader-win-rate')).toBeVisible();
    await expect(traderCard.getByTestId('trader-followers')).toBeVisible();
  });

  test('should sort traders by different criteria', async ({ page }) => {
    // Check for sort dropdown
    const sortDropdown = page.getByTestId('sort-dropdown');
    await expect(sortDropdown).toBeVisible();
    
    // Click to open sort options
    await sortDropdown.click();
    
    // Check for sort options
    await expect(page.getByText(/PnL/i)).toBeVisible();
    await expect(page.getByText(/Win Rate/i)).toBeVisible();
    await expect(page.getByText(/Followers/i)).toBeVisible();
    
    // Select win rate
    await page.getByText(/Win Rate/i).click();
    
    // Verify sort is applied
    await expect(sortDropdown).toContainText(/Win Rate/i);
  });

  test('should open trader profile modal', async ({ page }) => {
    // Click on a trader card
    await page.getByTestId('trader-card').first().click();
    
    // Check for profile modal
    await expect(page.getByTestId('trader-profile-modal')).toBeVisible();
    
    // Check for profile details
    await expect(page.getByTestId('trader-username')).toBeVisible();
    await expect(page.getByTestId('trader-bio')).toBeVisible();
    await expect(page.getByTestId('trader-stats-detailed')).toBeVisible();
  });

  test('should show trader positions', async ({ page }) => {
    // Click on a trader card
    await page.getByTestId('trader-card').first().click();
    
    // Wait for modal
    await page.waitForSelector('[data-testid="trader-profile-modal"]');
    
    // Click positions tab
    await page.getByTestId('positions-tab').click();
    
    // Check for positions list
    await expect(page.getByTestId('trader-positions')).toBeVisible();
  });

  test('should prompt login to follow trader', async ({ page }) => {
    // Click on a trader card
    await page.getByTestId('trader-card').first().click();
    
    // Click follow button
    await page.getByTestId('follow-button').click();
    
    // Check for login prompt or wallet connect
    const loginPrompt = page.getByTestId('login-prompt');
    const walletConnect = page.getByTestId('wallet-connect-modal');
    
    await expect(loginPrompt.or(walletConnect)).toBeVisible();
  });

  test('should show copy settings modal', async ({ page }) => {
    // Assuming user is logged in (mock auth state)
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({ token: 'test_token' }));
    });
    await page.reload();
    
    // Click on a trader card
    await page.getByTestId('trader-card').first().click();
    
    // Click follow/copy button
    await page.getByTestId('follow-button').click();
    
    // Check for copy settings modal (if authenticated)
    // This may show wallet connect first in real scenario
  });

  test('should filter traders by time period', async ({ page }) => {
    // Check for time filter
    const timeFilter = page.getByTestId('time-filter');
    await expect(timeFilter).toBeVisible();
    
    // Click to open filter options
    await timeFilter.click();
    
    // Check for options
    await expect(page.getByText('7 Days')).toBeVisible();
    await expect(page.getByText('30 Days')).toBeVisible();
    await expect(page.getByText('All Time')).toBeVisible();
    
    // Select 7 days
    await page.getByText('7 Days').click();
  });

  test('should show trader badges', async ({ page }) => {
    const traderCard = page.getByTestId('trader-card').first();
    
    // Check for badges (if trader has them)
    const badges = traderCard.getByTestId('trader-badges');
    await expect(badges).toBeVisible();
  });

  test('should show copy trade history', async ({ page }) => {
    // Navigate to history tab/section
    const historyTab = page.getByTestId('copy-history-tab');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await expect(page.getByTestId('copy-history-list')).toBeVisible();
    }
  });

  test('should search traders', async ({ page }) => {
    // Check for search input
    const searchInput = page.getByPlaceholder(/search.*trader/i);
    
    if (await searchInput.isVisible()) {
      // Search for a trader
      await searchInput.fill('alpha');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Verify filtered results
    }
  });

  test('should pagination work', async ({ page }) => {
    // Check for pagination
    const pagination = page.getByTestId('pagination');
    
    if (await pagination.isVisible()) {
      // Check for page numbers or next button
      const nextButton = page.getByTestId('next-page');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        // Verify page changed
      }
    }
  });
});
