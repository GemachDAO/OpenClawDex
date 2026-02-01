import { test, expect, Page } from '@playwright/test';

test.describe('Trade Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to trade page
    await page.goto('/trade');
  });

  test('should display trade form', async ({ page }) => {
    // Check for trade form elements
    await expect(page.getByTestId('trade-form')).toBeVisible();
    await expect(page.getByLabel(/from/i)).toBeVisible();
    await expect(page.getByLabel(/to/i)).toBeVisible();
  });

  test('should display token selection', async ({ page }) => {
    // Click on from token selector
    await page.getByTestId('from-token-selector').click();
    
    // Check for token list
    await expect(page.getByTestId('token-list')).toBeVisible();
    
    // Check for popular tokens
    await expect(page.getByText('ETH')).toBeVisible();
    await expect(page.getByText('USDC')).toBeVisible();
  });

  test('should search for tokens', async ({ page }) => {
    // Open token selector
    await page.getByTestId('from-token-selector').click();
    
    // Search for a token
    await page.getByPlaceholder(/search/i).fill('bitcoin');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check for search results
    await expect(page.getByText(/BTC|Bitcoin/i)).toBeVisible();
  });

  test('should get swap quote', async ({ page }) => {
    // Select from token
    await page.getByTestId('from-token-selector').click();
    await page.getByText('ETH').click();
    
    // Select to token
    await page.getByTestId('to-token-selector').click();
    await page.getByText('USDC').click();
    
    // Enter amount
    await page.getByTestId('from-amount-input').fill('1');
    
    // Wait for quote
    await page.waitForTimeout(1000);
    
    // Check for quote display
    await expect(page.getByTestId('to-amount-display')).toBeVisible();
    await expect(page.getByTestId('exchange-rate')).toBeVisible();
  });

  test('should show price impact warning for large trades', async ({ page }) => {
    // Select tokens
    await page.getByTestId('from-token-selector').click();
    await page.getByText('ETH').click();
    
    await page.getByTestId('to-token-selector').click();
    await page.getByText('USDC').click();
    
    // Enter large amount
    await page.getByTestId('from-amount-input').fill('1000');
    
    // Wait for quote
    await page.waitForTimeout(1000);
    
    // Check for price impact warning
    await expect(page.getByTestId('price-impact-warning')).toBeVisible();
  });

  test('should swap tokens button (reverse)', async ({ page }) => {
    // Select from token
    await page.getByTestId('from-token-selector').click();
    await page.getByText('ETH').click();
    
    // Select to token
    await page.getByTestId('to-token-selector').click();
    await page.getByText('USDC').click();
    
    // Click swap button
    await page.getByTestId('swap-direction-button').click();
    
    // Verify tokens are swapped
    await expect(page.getByTestId('from-token-selector')).toContainText('USDC');
    await expect(page.getByTestId('to-token-selector')).toContainText('ETH');
  });

  test('should show slippage settings', async ({ page }) => {
    // Open settings
    await page.getByTestId('settings-button').click();
    
    // Check for slippage options
    await expect(page.getByText(/slippage/i)).toBeVisible();
    await expect(page.getByRole('button', { name: '0.5%' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1%' })).toBeVisible();
  });

  test('should allow custom slippage', async ({ page }) => {
    // Open settings
    await page.getByTestId('settings-button').click();
    
    // Enter custom slippage
    await page.getByTestId('custom-slippage-input').fill('2.5');
    
    // Close settings
    await page.getByTestId('close-settings').click();
    
    // Verify slippage is applied (would check in quote)
  });

  test('should prompt wallet connection for swap', async ({ page }) => {
    // Select tokens
    await page.getByTestId('from-token-selector').click();
    await page.getByText('ETH').click();
    
    await page.getByTestId('to-token-selector').click();
    await page.getByText('USDC').click();
    
    // Enter amount
    await page.getByTestId('from-amount-input').fill('1');
    
    // Wait for quote
    await page.waitForTimeout(1000);
    
    // Click swap button (should prompt connect wallet)
    await page.getByTestId('swap-button').click();
    
    // Check for wallet connection modal
    await expect(page.getByTestId('wallet-connect-modal')).toBeVisible();
  });

  test('should display recent transactions', async ({ page }) => {
    // Check for transaction history section
    await expect(page.getByTestId('recent-transactions')).toBeVisible();
  });

  test('should filter by chain', async ({ page }) => {
    // Check for chain selector
    const chainSelector = page.getByTestId('chain-selector');
    await expect(chainSelector).toBeVisible();
    
    // Click to open chain options
    await chainSelector.click();
    
    // Check for chain options
    await expect(page.getByText('Ethereum')).toBeVisible();
    await expect(page.getByText('BSC')).toBeVisible();
    await expect(page.getByText('Polygon')).toBeVisible();
  });
});
