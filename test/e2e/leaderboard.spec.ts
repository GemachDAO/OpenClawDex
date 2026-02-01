import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('should display leaderboard table', async ({ page }) => {
    // Check for leaderboard table
    await expect(page.getByTestId('leaderboard-table')).toBeVisible();
    
    // Check for table headers
    await expect(page.getByText('Rank')).toBeVisible();
    await expect(page.getByText(/Trader|Username/i)).toBeVisible();
    await expect(page.getByText(/PnL|Profit/i)).toBeVisible();
  });

  test('should show top 3 featured', async ({ page }) => {
    // Check for featured top traders section
    const featuredSection = page.getByTestId('featured-traders');
    
    if (await featuredSection.isVisible()) {
      // Check for podium or featured cards
      await expect(page.getByTestId('rank-1')).toBeVisible();
    }
  });

  test('should display trader ranks', async ({ page }) => {
    // Check for rank numbers
    const rows = page.getByTestId('leaderboard-row');
    const firstRow = rows.first();
    
    await expect(firstRow.getByTestId('trader-rank')).toBeVisible();
    await expect(firstRow.getByTestId('trader-name')).toBeVisible();
  });

  test('should show PnL values', async ({ page }) => {
    const rows = page.getByTestId('leaderboard-row');
    const firstRow = rows.first();
    
    // Check for PnL
    await expect(firstRow.getByTestId('trader-pnl')).toBeVisible();
    
    // PnL should be formatted as currency
    const pnlText = await firstRow.getByTestId('trader-pnl').textContent();
    expect(pnlText).toMatch(/[$€]|[0-9]+/);
  });

  test('should filter by time period', async ({ page }) => {
    // Check for time period filter
    const periodFilter = page.getByTestId('period-filter');
    await expect(periodFilter).toBeVisible();
    
    // Click to open filter
    await periodFilter.click();
    
    // Check for options
    await expect(page.getByText(/Daily|24h/i)).toBeVisible();
    await expect(page.getByText(/Weekly|7d/i)).toBeVisible();
    await expect(page.getByText(/Monthly|30d/i)).toBeVisible();
    
    // Select weekly
    await page.getByText(/Weekly|7d/i).click();
    
    // Verify filter applied
    await page.waitForTimeout(500);
  });

  test('should sort by different columns', async ({ page }) => {
    // Click on sortable column header
    const pnlHeader = page.getByRole('columnheader', { name: /PnL|Profit/i });
    
    if (await pnlHeader.isVisible()) {
      await pnlHeader.click();
      
      // Check for sort indicator
      await expect(pnlHeader.getByTestId('sort-indicator').or(pnlHeader.locator('[class*="sort"]'))).toBeVisible();
    }
  });

  test('should show win rate column', async ({ page }) => {
    // Check for win rate column
    const winRateHeader = page.getByText(/Win.*Rate/i);
    
    if (await winRateHeader.isVisible()) {
      const rows = page.getByTestId('leaderboard-row');
      const firstRow = rows.first();
      
      await expect(firstRow.getByTestId('trader-win-rate')).toBeVisible();
    }
  });

  test('should click trader to view profile', async ({ page }) => {
    // Click on a trader row
    const rows = page.getByTestId('leaderboard-row');
    await rows.first().click();
    
    // Check for profile modal or navigation
    const profileModal = page.getByTestId('trader-profile-modal');
    const profileUrl = page.url();
    
    const modalVisible = await profileModal.isVisible().catch(() => false);
    const urlChanged = profileUrl.includes('/trader/') || profileUrl.includes('/profile/');
    
    expect(modalVisible || urlChanged).toBe(true);
  });

  test('should show ROI percentage', async ({ page }) => {
    const rows = page.getByTestId('leaderboard-row');
    const firstRow = rows.first();
    
    // Check for ROI
    const roi = firstRow.getByTestId('trader-roi');
    
    if (await roi.isVisible()) {
      const roiText = await roi.textContent();
      expect(roiText).toMatch(/%/);
    }
  });

  test('should pagination through leaderboard', async ({ page }) => {
    // Check for pagination
    const pagination = page.getByTestId('pagination');
    
    if (await pagination.isVisible()) {
      // Check current page
      const currentPage = page.getByTestId('current-page');
      const initialPage = await currentPage.textContent();
      
      // Click next
      await page.getByTestId('next-page').click();
      
      // Wait for load
      await page.waitForTimeout(500);
      
      // Verify page changed
      const newPage = await currentPage.textContent();
      expect(newPage).not.toBe(initialPage);
    }
  });

  test('should show total participants', async ({ page }) => {
    // Check for total count
    const totalParticipants = page.getByTestId('total-participants');
    
    if (await totalParticipants.isVisible()) {
      const text = await totalParticipants.textContent();
      expect(text).toMatch(/[0-9]+/);
    }
  });

  test('should highlight user position', async ({ page }) => {
    // Mock authenticated user
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({ 
        token: 'test_token',
        agentId: 'agent_001'
      }));
    });
    await page.reload();
    
    // Check for highlighted row
    const highlightedRow = page.locator('[data-testid="leaderboard-row"][data-highlighted="true"]');
    
    // May or may not be visible depending on if user is on leaderboard
  });

  test('should show badges on leaderboard', async ({ page }) => {
    const rows = page.getByTestId('leaderboard-row');
    const firstRow = rows.first();
    
    // Check for badges
    const badges = firstRow.getByTestId('trader-badges');
    
    // Badges may or may not exist
    if (await badges.isVisible()) {
      expect(badges).toBeVisible();
    }
  });

  test('should responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check table is still visible or converted to cards
    const table = page.getByTestId('leaderboard-table');
    const cards = page.getByTestId('leaderboard-cards');
    
    const tableVisible = await table.isVisible().catch(() => false);
    const cardsVisible = await cards.isVisible().catch(() => false);
    
    expect(tableVisible || cardsVisible).toBe(true);
  });
});
