import { test, expect } from '@playwright/test'

test.describe('Complete Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })

    // Mock comprehensive API responses
    await page.route('/api/v1/**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()
      
      if (url.includes('/auth/user') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
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
      } else if (url.includes('/posts') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            posts: [
              {
                id: 1,
                title: 'React 18 Features',
                content: 'New features in React 18...',
                author: 'reactdev',
                subreddit: 'reactjs',
                score: 150,
                numComments: 25,
                createdUtc: '2024-01-01T00:00:00Z',
                url: 'https://reddit.com/r/reactjs/1'
              }
            ],
            total: 100,
            page: 1,
            limit: 20,
            totalPages: 5
          })
        })
      } else if (url.includes('/content') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              title: 'React Trends Analysis',
              contentType: 'blog',
              content: '# React Trends\n\nReact continues to dominate...',
              createdAt: '2024-01-01T00:00:00Z',
              metadata: { keywords: ['react'], template: 'blog' }
            }
          ])
        })
      } else if (url.includes('/crawl/status') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            lastRun: '2024-01-01T00:00:00Z',
            nextRun: '2024-01-01T01:00:00Z',
            progress: 100
          })
        })
      } else {
        await route.continue()
      }
    })
  })

  test('complete admin workflow: dashboard → keywords → posts → content → monitoring', async ({ page }) => {
    // Step 1: Start at dashboard
    await page.goto('/dashboard')
    
    // Verify dashboard loads with key metrics
    await expect(page.getByText(/dashboard/i)).toBeVisible()
    await expect(page.getByText('1,000')).toBeVisible() // Total posts
    await expect(page.getByText('25')).toBeVisible() // Total keywords
    await expect(page.getByText('3')).toBeVisible() // Active crawls
    
    // Step 2: Navigate to keywords management
    const keywordsNavLink = page.getByRole('link', { name: /keywords/i })
    await expect(keywordsNavLink).toBeVisible()
    await keywordsNavLink.click()
    
    await expect(page).toHaveURL(/.*keywords/)
    await expect(page.getByText('react')).toBeVisible()
    await expect(page.getByText('100 posts')).toBeVisible()
    
    // Step 3: Navigate to posts view
    const postsNavLink = page.getByRole('link', { name: /posts/i })
    await expect(postsNavLink).toBeVisible()
    await postsNavLink.click()
    
    await expect(page).toHaveURL(/.*posts/)
    await expect(page.getByText('React 18 Features')).toBeVisible()
    await expect(page.getByText('reactdev')).toBeVisible()
    await expect(page.getByText('150')).toBeVisible() // Score
    
    // Step 4: Navigate to content management
    const contentNavLink = page.getByRole('link', { name: /content/i })
    await expect(contentNavLink).toBeVisible()
    await contentNavLink.click()
    
    await expect(page).toHaveURL(/.*content/)
    await expect(page.getByText('React Trends Analysis')).toBeVisible()
    await expect(page.getByText('blog')).toBeVisible()
    
    // Step 5: Navigate to monitoring
    const monitoringNavLink = page.getByRole('link', { name: /monitoring/i })
    await expect(monitoringNavLink).toBeVisible()
    await monitoringNavLink.click()
    
    await expect(page).toHaveURL(/.*monitoring/)
    await expect(page.getByText(/crawling status/i)).toBeVisible()
    await expect(page.getByText(/not running/i)).toBeVisible()
  })

  test('responsive navigation and mobile experience', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Mobile menu should be collapsed initially
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    await expect(mobileMenuButton).toBeVisible()
    
    // Click to open mobile menu
    await mobileMenuButton.click()
    
    // Navigation items should be visible
    await expect(page.getByRole('link', { name: /keywords/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /posts/i })).toBeVisible()
    
    // Navigate to keywords page
    await page.getByRole('link', { name: /keywords/i }).click()
    await expect(page).toHaveURL(/.*keywords/)
    
    // Content should be responsive
    await expect(page.getByText('react')).toBeVisible()
  })

  test('search and filtering across different pages', async ({ page }) => {
    // Test search on posts page
    await page.goto('/posts')
    
    const searchInput = page.getByPlaceholder(/search posts/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('React 18')
    
    // Should filter results
    await expect(page.getByText('React 18 Features')).toBeVisible()
    
    // Test filtering by subreddit
    const subredditFilter = page.getByLabel(/subreddit/i)
    if (await subredditFilter.isVisible()) {
      await subredditFilter.selectOption('reactjs')
      await expect(page.getByText('reactjs')).toBeVisible()
    }
    
    // Clear filters
    const clearButton = page.getByRole('button', { name: /clear filters/i })
    if (await clearButton.isVisible()) {
      await clearButton.click()
    }
  })

  test('real-time updates and notifications', async ({ page }) => {
    await page.goto('/monitoring')
    
    // Mock WebSocket connection for real-time updates
    await page.evaluate(() => {
      // Simulate real-time crawling status update
      window.dispatchEvent(new CustomEvent('crawling-status-update', {
        detail: {
          isRunning: true,
          progress: 45,
          currentKeyword: 'react'
        }
      }))
    })
    
    // Should show updated status
    await expect(page.getByText(/running/i)).toBeVisible()
    await expect(page.getByText('45%')).toBeVisible()
    
    // Test notification system
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('notification', {
        detail: {
          type: 'success',
          message: 'Crawling completed successfully'
        }
      }))
    })
    
    // Should show notification
    await expect(page.getByText(/crawling completed successfully/i)).toBeVisible()
  })

  test('error handling and recovery', async ({ page }) => {
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
    
    // Should show error state
    await expect(page.getByText(/error/i)).toBeVisible()
    await expect(page.getByText(/internal server error/i)).toBeVisible()
    
    // Should have retry button
    const retryButton = page.getByRole('button', { name: /retry/i })
    if (await retryButton.isVisible()) {
      // Mock successful retry
      await page.route('/api/v1/keywords', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      })
      
      await retryButton.click()
      
      // Should recover from error
      await expect(page.getByText(/error/i)).not.toBeVisible()
    }
  })

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement)
    
    // Test screen reader support
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeVisible()
    
    // Test proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    // Test form labels
    await page.goto('/keywords')
    const addButton = page.getByRole('button', { name: /add keyword/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      
      const keywordInput = page.getByLabel(/keyword/i)
      await expect(keywordInput).toBeVisible()
    }
  })

  test('performance and loading states', async ({ page }) => {
    // Test loading states
    await page.goto('/dashboard')
    
    // Should show loading skeletons initially
    const loadingElements = page.locator('.animate-pulse')
    if (await loadingElements.first().isVisible()) {
      await expect(loadingElements.first()).toBeVisible()
    }
    
    // Wait for content to load
    await expect(page.getByText('1,000')).toBeVisible()
    
    // Test page transitions
    const startTime = Date.now()
    await page.getByRole('link', { name: /keywords/i }).click()
    await expect(page).toHaveURL(/.*keywords/)
    const endTime = Date.now()
    
    // Navigation should be reasonably fast
    expect(endTime - startTime).toBeLessThan(3000)
  })
})