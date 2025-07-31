import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the backend API responses
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
      } else if (url.includes('/auth/login') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600
          })
        })
      } else {
        await route.continue()
      }
    })
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
    
    // Should show login form
    await expect(page.getByText(/sign in/i)).toBeVisible()
    await expect(page.getByText(/reddit/i)).toBeVisible()
  })

  test('should complete OAuth login flow', async ({ page }) => {
    await page.goto('/login')
    
    // Click Reddit login button
    const loginButton = page.getByRole('button', { name: /sign in with reddit/i })
    await expect(loginButton).toBeVisible()
    
    // Mock the OAuth redirect
    await page.route('**/auth/reddit', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/callback?code=test-code&state=test-state'
        }
      })
    })
    
    await loginButton.click()
    
    // Should redirect to callback page and then to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Should show dashboard content
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test('should handle login errors gracefully', async ({ page }) => {
    // Mock failed login
    await page.route('/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      })
    })
    
    await page.goto('/auth/callback?code=invalid-code&state=test-state')
    
    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible()
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })
    
    await page.goto('/dashboard')
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
    
    // Token should be removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth-token'))
    expect(token).toBeNull()
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })
    
    await page.goto('/dashboard')
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    
    // Refresh the page
    await page.reload()
    
    // Should still be authenticated
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    await expect(page).toHaveURL(/.*dashboard/)
  })
})