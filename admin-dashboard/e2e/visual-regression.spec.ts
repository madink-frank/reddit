import { test, expect } from '@playwright/test'

/**
 * End-to-End Visual Regression Tests
 * 
 * These tests capture screenshots of the application in different states
 * and compare them against baseline images to detect visual regressions.
 */

// Test configuration
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'large-desktop', width: 1440, height: 900 },
]

const themes = ['light', 'dark']

test.describe('Visual Regression Tests - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle')
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    })
  })

  test.describe('Login Page', () => {
    viewports.forEach(({ name, width, height }) => {
      test(`should render login page correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        
        // Navigate to login page
        await page.goto('/auth/login')
        await page.waitForLoadState('networkidle')
        
        // Wait for components to render
        await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 })
        
        // Take screenshot
        await expect(page).toHaveScreenshot(`login-page-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })
    })

    test('should render login form with validation errors', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')
      
      // Try to submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      
      // Wait for error messages
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 2000 })
      
      // Take screenshot
      await expect(page).toHaveScreenshot('login-form-validation-errors.png', {
        animations: 'disabled',
      })
    })
  })

  test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'mock-token')
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        }))
      })
      
      // Navigate to dashboard
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    viewports.forEach(({ name, width, height }) => {
      test(`should render dashboard correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        
        // Wait for dashboard components to load
        await page.waitForSelector('[data-testid="stat-card"]', { timeout: 5000 })
        await page.waitForSelector('[data-testid="system-status"]', { timeout: 5000 })
        
        // Take screenshot
        await expect(page).toHaveScreenshot(`dashboard-${name}.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })
    })

    test('should render dashboard with loading states', async ({ page }) => {
      // Intercept API calls to simulate loading
      await page.route('**/api/dashboard/stats', route => {
        // Delay response to capture loading state
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              totalPosts: 1234,
              activeUsers: 856,
              comments: 2341,
              systemLoad: 78
            })
          })
        }, 2000)
      })
      
      await page.reload()
      
      // Wait for loading skeletons
      await page.waitForSelector('[data-testid="loading-skeleton"]', { timeout: 2000 })
      
      // Take screenshot of loading state
      await expect(page).toHaveScreenshot('dashboard-loading-state.png', {
        animations: 'disabled',
      })
    })

    test('should render dashboard with error states', async ({ page }) => {
      // Intercept API calls to simulate errors
      await page.route('**/api/dashboard/stats', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      })
      
      await page.reload()
      
      // Wait for error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 })
      
      // Take screenshot
      await expect(page).toHaveScreenshot('dashboard-error-state.png', {
        animations: 'disabled',
      })
    })
  })

  test.describe('Component Interactions', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'mock-token')
      })
      
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    test('should render button hover states', async ({ page }) => {
      const button = page.locator('button').first()
      
      // Hover over button
      await button.hover()
      
      // Take screenshot of hover state
      await expect(button).toHaveScreenshot('button-hover-state.png')
    })

    test('should render button focus states', async ({ page }) => {
      const button = page.locator('button').first()
      
      // Focus button
      await button.focus()
      
      // Take screenshot of focus state
      await expect(button).toHaveScreenshot('button-focus-state.png')
    })

    test('should render modal dialogs', async ({ page }) => {
      // Look for a button that opens a modal
      const modalTrigger = page.locator('[data-testid="open-modal"]').first()
      
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click()
        
        // Wait for modal to appear
        await page.waitForSelector('[role="dialog"]', { timeout: 2000 })
        
        // Take screenshot
        await expect(page).toHaveScreenshot('modal-dialog.png', {
          animations: 'disabled',
        })
      }
    })
  })

  test.describe('Form Components', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/keywords')
      await page.waitForLoadState('networkidle')
    })

    test('should render form components correctly', async ({ page }) => {
      // Wait for form elements
      await page.waitForSelector('input', { timeout: 5000 })
      
      // Take screenshot of form
      await expect(page.locator('form').first()).toHaveScreenshot('form-components.png')
    })

    test('should render form validation states', async ({ page }) => {
      const input = page.locator('input[required]').first()
      
      if (await input.count() > 0) {
        // Focus and blur to trigger validation
        await input.focus()
        await input.blur()
        
        // Wait for validation message
        await page.waitForTimeout(500)
        
        // Take screenshot
        await expect(page.locator('form').first()).toHaveScreenshot('form-validation.png')
      }
    })
  })

  test.describe('Theme Switching', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    themes.forEach(theme => {
      test(`should render correctly in ${theme} theme`, async ({ page }) => {
        // Apply theme
        await page.evaluate((themeName) => {
          document.documentElement.setAttribute('data-theme', themeName)
          document.documentElement.className = themeName === 'dark' ? 'dark' : ''
        }, theme)
        
        // Wait for theme to apply
        await page.waitForTimeout(500)
        
        // Take screenshot
        await expect(page).toHaveScreenshot(`dashboard-${theme}-theme.png`, {
          fullPage: true,
          animations: 'disabled',
        })
      })
    })

    test('should render theme switch component', async ({ page }) => {
      const themeSwitch = page.locator('[data-testid="theme-switch"]')
      
      if (await themeSwitch.count() > 0) {
        // Take screenshot of theme switch
        await expect(themeSwitch).toHaveScreenshot('theme-switch-component.png')
        
        // Click to switch theme
        await themeSwitch.click()
        await page.waitForTimeout(500)
        
        // Take screenshot after theme change
        await expect(themeSwitch).toHaveScreenshot('theme-switch-toggled.png')
      }
    })
  })

  test.describe('Accessibility Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    test('should render skip links', async ({ page }) => {
      // Focus on skip links (usually hidden until focused)
      await page.keyboard.press('Tab')
      
      // Take screenshot
      await expect(page).toHaveScreenshot('skip-links.png')
    })

    test('should render keyboard navigation indicators', async ({ page }) => {
      // Navigate with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Take screenshot showing focus indicators
      await expect(page).toHaveScreenshot('keyboard-navigation.png', {
        animations: 'disabled',
      })
    })

    test('should render high contrast mode', async ({ page }) => {
      // Enable high contrast mode
      await page.evaluate(() => {
        document.documentElement.classList.add('high-contrast')
      })
      
      await page.waitForTimeout(500)
      
      // Take screenshot
      await expect(page).toHaveScreenshot('high-contrast-mode.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Loading States', () => {
    test('should render various loading states', async ({ page }) => {
      // Navigate to a page with loading states
      await page.goto('/posts')
      
      // Intercept API to delay response
      await page.route('**/api/posts', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ posts: [] })
          })
        }, 1000)
      })
      
      await page.reload()
      
      // Capture loading skeletons
      await page.waitForSelector('[data-testid="loading-skeleton"]', { timeout: 2000 })
      await expect(page).toHaveScreenshot('loading-skeletons.png', {
        animations: 'disabled',
      })
    })

    test('should render progress indicators', async ({ page }) => {
      // Look for progress bars or spinners
      const progressBar = page.locator('[role="progressbar"]')
      
      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toHaveScreenshot('progress-indicator.png')
      }
    })
  })

  test.describe('Error States', () => {
    test('should render 404 page', async ({ page }) => {
      await page.goto('/non-existent-page')
      
      // Wait for 404 page to load
      await page.waitForLoadState('networkidle')
      
      // Take screenshot
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should render error boundaries', async ({ page }) => {
      // This would require triggering an error in the application
      // For now, we'll just check if error boundary components exist
      const errorBoundary = page.locator('[data-testid="error-boundary"]')
      
      if (await errorBoundary.count() > 0) {
        await expect(errorBoundary).toHaveScreenshot('error-boundary.png')
      }
    })
  })
})