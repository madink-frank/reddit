import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('E2E Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })

    // Mock API responses
    await page.route('/api/v1/**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()
      
      if (url.includes('/auth/user') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            isAdmin: true
          })
        })
      } else if (url.includes('/analytics/dashboard') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPosts: 1000,
            totalKeywords: 25,
            activeCrawls: 3,
            trendingKeywords: ['react', 'vue', 'angular']
          })
        })
      } else if (url.includes('/keywords') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              keyword: 'react',
              description: 'React framework',
              isActive: true,
              postCount: 100,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ])
        })
      } else {
        await route.continue()
      }
    })
  })

  test('dashboard page should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for content to load
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keywords page should be accessible', async ({ page }) => {
    await page.goto('/keywords')
    
    // Wait for content to load
    await expect(page.getByText('react')).toBeVisible()
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('modal dialogs should be accessible', async ({ page }) => {
    await page.goto('/keywords')
    
    // Open add keyword modal
    const addButton = page.getByRole('button', { name: /add keyword/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Wait for modal to open
      await expect(page.getByText(/add new keyword/i)).toBeVisible()
      
      // Run accessibility scan on modal
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('form validation should be accessible', async ({ page }) => {
    await page.goto('/keywords')
    
    const addButton = page.getByRole('button', { name: /add keyword/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Try to submit empty form to trigger validation
      const submitButton = page.getByRole('button', { name: /save|create/i })
      await submitButton.click()
      
      // Wait for validation errors
      await page.waitForTimeout(500)
      
      // Run accessibility scan with validation errors
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('keyboard navigation should work properly', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement)
    
    // Continue tabbing through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Test that focus is visible
    const focusedElementWithFocus = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement
      const styles = window.getComputedStyle(element)
      return {
        tagName: element.tagName,
        hasFocusRing: styles.outline !== 'none' || styles.boxShadow.includes('focus')
      }
    })
    
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElementWithFocus.tagName)
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('screen reader announcements should work', async ({ page }) => {
    await page.goto('/keywords')
    
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').count()
    expect(liveRegions).toBeGreaterThan(0)
    
    // Check for proper headings structure
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1) // Should have exactly one h1
    
    // Check for proper form labels
    const inputs = await page.locator('input').count()
    if (inputs > 0) {
      const labeledInputs = await page.locator('input[aria-label], input[aria-labelledby], label input').count()
      expect(labeledInputs).toBeGreaterThan(0)
    }
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Run accessibility scan with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(contrastViolations).toEqual([])
  })

  test('images should have proper alt text', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check that all images have alt attributes
    const images = await page.locator('img').all()
    
    for (const image of images) {
      const alt = await image.getAttribute('alt')
      const role = await image.getAttribute('role')
      
      // Images should either have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBe(true)
    }
    
    // Run accessibility scan for image-related issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()
    
    const imageViolations = accessibilityScanResults.violations.filter(
      violation => violation.id.includes('image')
    )
    
    expect(imageViolations).toEqual([])
  })

  test('tables should be properly structured', async ({ page }) => {
    await page.goto('/keywords')
    
    // Check for proper table structure if tables exist
    const tables = await page.locator('table').count()
    
    if (tables > 0) {
      // Tables should have proper headers
      const tableHeaders = await page.locator('th').count()
      expect(tableHeaders).toBeGreaterThan(0)
      
      // Check for table captions or aria-label
      const tablesWithLabels = await page.locator('table[aria-label], table caption').count()
      expect(tablesWithLabels).toBeGreaterThan(0)
    }
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    const tableViolations = accessibilityScanResults.violations.filter(
      violation => violation.id.includes('table') || violation.id.includes('th-has-data-cells')
    )
    
    expect(tableViolations).toEqual([])
  })

  test('error states should be accessible', async ({ page }) => {
    // Mock API error
    await page.route('/api/v1/keywords', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      })
    })
    
    await page.goto('/keywords')
    
    // Wait for error state
    await expect(page.getByText(/error/i)).toBeVisible()
    
    // Check that error is announced to screen readers
    const errorElements = await page.locator('[role="alert"], [aria-live="assertive"]').count()
    expect(errorElements).toBeGreaterThan(0)
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('loading states should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for loading indicators with proper ARIA attributes
    const loadingElements = await page.locator('[aria-busy="true"], [aria-live="polite"]').count()
    
    // Should have some loading indicators
    if (loadingElements > 0) {
      // Run accessibility scan during loading
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('mobile accessibility should work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Test mobile navigation
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      // Check that mobile menu is accessible
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    
    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('focus management in SPAs should work', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Navigate to different page
    await page.getByRole('link', { name: /keywords/i }).click()
    await expect(page).toHaveURL(/.*keywords/)
    
    // Check that focus is managed properly after navigation
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeDefined()
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})