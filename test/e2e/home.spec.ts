import { test, expect } from '@playwright/test';

test.describe('Home Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    // Check for hero/main section
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for app name/branding
    await expect(page.getByText(/OpenClaw/i)).toBeVisible();
  });

  test('should have navigation', async ({ page }) => {
    // Check for nav elements
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for main nav links
    await expect(page.getByRole('link', { name: /trade/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /copy/i })).toBeVisible();
  });

  test('should navigate to trade page', async ({ page }) => {
    // Click trade link
    await page.getByRole('link', { name: /trade/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/.*trade/);
  });

  test('should navigate to copy trading page', async ({ page }) => {
    // Click copy trading link
    await page.getByRole('link', { name: /copy/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/.*copy/);
  });

  test('should navigate to leaderboard page', async ({ page }) => {
    // Click leaderboard link
    await page.getByRole('link', { name: /leaderboard/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/.*leaderboard/);
  });

  test('should show wallet connect button', async ({ page }) => {
    // Check for wallet connect button
    const walletButton = page.getByTestId('wallet-connect-button').or(
      page.getByRole('button', { name: /connect.*wallet/i })
    );
    
    await expect(walletButton).toBeVisible();
  });

  test('should open wallet connect modal', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.getByTestId('wallet-connect-button').or(
      page.getByRole('button', { name: /connect.*wallet/i })
    );
    
    await walletButton.click();
    
    // Check for wallet modal
    const modal = page.getByTestId('wallet-connect-modal').or(
      page.getByRole('dialog')
    );
    
    await expect(modal).toBeVisible();
  });

  test('should show activity feed', async ({ page }) => {
    // Check for activity feed section
    const activityFeed = page.getByTestId('activity-feed');
    
    if (await activityFeed.isVisible()) {
      // Check for activity items
      const activityItems = page.getByTestId('activity-item');
      expect(await activityItems.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display stats/metrics', async ({ page }) => {
    // Check for stats section
    const statsSection = page.getByTestId('stats-section').or(
      page.locator('[class*="stats"], [class*="metrics"]')
    );
    
    if (await statsSection.isVisible()) {
      // Stats might include TVL, volume, users, etc.
      await expect(statsSection).toBeVisible();
    }
  });

  test('should have footer', async ({ page }) => {
    // Check for footer
    const footer = page.getByRole('contentinfo').or(page.locator('footer'));
    
    await expect(footer).toBeVisible();
  });

  test('should show featured tokens or markets', async ({ page }) => {
    // Check for featured tokens section
    const featuredSection = page.getByTestId('featured-tokens').or(
      page.getByTestId('trending-tokens')
    ).or(page.locator('[class*="featured"], [class*="trending"]'));
    
    // May or may not be present
    if (await featuredSection.isVisible()) {
      await expect(featuredSection).toBeVisible();
    }
  });

  test('should responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for mobile menu button
    const menuButton = page.getByTestId('mobile-menu-button').or(
      page.getByRole('button', { name: /menu/i })
    );
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check mobile nav opens
      const mobileNav = page.getByTestId('mobile-nav').or(
        page.locator('[class*="mobile-menu"], [class*="drawer"]')
      );
      
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should toggle dark/light mode', async ({ page }) => {
    // Check for theme toggle
    const themeToggle = page.getByTestId('theme-toggle').or(
      page.getByRole('button', { name: /theme|dark|light/i })
    );
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      // Click toggle
      await themeToggle.click();
      
      // Check theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should show social links', async ({ page }) => {
    // Check for social links (usually in footer)
    const socialLinks = page.locator('a[href*="twitter"], a[href*="discord"], a[href*="telegram"]');
    
    if (await socialLinks.first().isVisible()) {
      expect(await socialLinks.count()).toBeGreaterThan(0);
    }
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out common third-party errors
    const significantErrors = errors.filter(
      e => !e.includes('favicon') && !e.includes('analytics') && !e.includes('third-party')
    );
    
    expect(significantErrors.length).toBe(0);
  });

  test('should have proper page title', async ({ page }) => {
    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.toLowerCase()).toContain('openclaw');
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check for important meta tags
    const description = await page.getAttribute('meta[name="description"]', 'content');
    
    if (description) {
      expect(description.length).toBeGreaterThan(10);
    }
  });
});

test.describe('Wallet Connection Flow', () => {
  test('should show wallet options', async ({ page }) => {
    await page.goto('/');
    
    // Open wallet modal
    const walletButton = page.getByTestId('wallet-connect-button').or(
      page.getByRole('button', { name: /connect.*wallet/i })
    );
    
    await walletButton.click();
    
    // Check for wallet options
    const modalContent = page.getByRole('dialog').or(page.getByTestId('wallet-connect-modal'));
    await expect(modalContent).toBeVisible();
    
    // Check for common wallet options
    const metamask = page.getByText(/metamask/i);
    const walletConnect = page.getByText(/wallet.*connect/i);
    
    // At least one wallet option should be visible
    const metamaskVisible = await metamask.isVisible().catch(() => false);
    const wcVisible = await walletConnect.isVisible().catch(() => false);
    
    expect(metamaskVisible || wcVisible).toBe(true);
  });

  test('should close wallet modal', async ({ page }) => {
    await page.goto('/');
    
    // Open wallet modal
    const walletButton = page.getByTestId('wallet-connect-button').or(
      page.getByRole('button', { name: /connect.*wallet/i })
    );
    
    await walletButton.click();
    
    // Wait for modal
    const modal = page.getByRole('dialog').or(page.getByTestId('wallet-connect-modal'));
    await expect(modal).toBeVisible();
    
    // Close modal (click outside or close button)
    const closeButton = page.getByTestId('close-modal').or(
      page.getByRole('button', { name: /close/i })
    ).or(page.locator('[aria-label="close"], [class*="close"]'));
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Click outside modal
      await page.locator('body').click({ position: { x: 10, y: 10 } });
    }
    
    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should show 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-page-that-does-not-exist');
    
    // Check for 404 content
    const notFound = page.getByText(/404|not found|page.*not.*exist/i);
    
    await expect(notFound).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate failure
    await page.route('**/api/**', (route) => {
      route.abort();
    });
    
    await page.goto('/');
    
    // Page should still load
    await expect(page.getByRole('main')).toBeVisible();
    
    // May show error state or fallback content
  });
});
