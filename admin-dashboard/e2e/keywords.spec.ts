import { test, expect } from '@playwright/test'

test.describe('Keywords Management', () => {
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
              postCount: 10,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              keyword: 'vue',
              description: 'Vue framework',
              isActive: true,
              postCount: 5,
              createdAt: '2024-01-02T00:00:00Z'
            }
          ])
        })
      } else if (url.includes('/keywords') && method === 'POST') {
        const body = await route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            keyword: body.keyword,
            description: body.description,
            isActive: true,
            postCount: 0,
            createdAt: new Date().toISOString()
          })
        })
      } else if (url.includes('/keywords/') && method === 'PUT') {
        const body = await route.request().postDataJSON()
        const id = url.split('/').pop()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: parseInt(id!),
            keyword: body.keyword,
            description: body.description,
            isActive: body.isActive,
            postCount: 0,
            createdAt: '2024-01-01T00:00:00Z'
          })
        })
      } else if (url.includes('/keywords/') && method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else {
        await route.continue()
      }
    })
  })

  test('should display keywords list', async ({ page }) => {
    await page.goto('/keywords')
    
    // Should show keywords page
    await expect(page.getByText(/keywords/i)).toBeVisible()
    
    // Should display existing keywords
    await expect(page.getByText('react')).toBeVisible()
    await expect(page.getByText('React framework')).toBeVisible()
    await expect(page.getByText('vue')).toBeVisible()
    await expect(page.getByText('Vue framework')).toBeVisible()
    
    // Should show post counts
    await expect(page.getByText('10 posts')).toBeVisible()
    await expect(page.getByText('5 posts')).toBeVisible()
  })

  test('should create new keyword', async ({ page }) => {
    await page.goto('/keywords')
    
    // Click add keyword button
    const addButton = page.getByRole('button', { name: /add keyword/i })
    await expect(addButton).toBeVisible()
    await addButton.click()
    
    // Should open modal/form
    await expect(page.getByText(/add new keyword/i)).toBeVisible()
    
    // Fill out the form
    await page.getByLabel(/keyword/i).fill('angular')
    await page.getByLabel(/description/i).fill('Angular framework')
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /save|create/i })
    await submitButton.click()
    
    // Should show success message
    await expect(page.getByText(/success/i)).toBeVisible()
    
    // Should display new keyword in the list
    await expect(page.getByText('angular')).toBeVisible()
    await expect(page.getByText('Angular framework')).toBeVisible()
  })

  test('should edit existing keyword', async ({ page }) => {
    await page.goto('/keywords')
    
    // Find and click edit button for first keyword
    const editButton = page.getByRole('button', { name: /edit/i }).first()
    await expect(editButton).toBeVisible()
    await editButton.click()
    
    // Should open edit modal/form
    await expect(page.getByText(/edit keyword/i)).toBeVisible()
    
    // Form should be pre-filled
    await expect(page.getByDisplayValue('react')).toBeVisible()
    await expect(page.getByDisplayValue('React framework')).toBeVisible()
    
    // Update the description
    const descriptionField = page.getByLabel(/description/i)
    await descriptionField.clear()
    await descriptionField.fill('Updated React framework description')
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /save|update/i })
    await submitButton.click()
    
    // Should show success message
    await expect(page.getByText(/success/i)).toBeVisible()
    
    // Should display updated description
    await expect(page.getByText('Updated React framework description')).toBeVisible()
  })

  test('should delete keyword with confirmation', async ({ page }) => {
    await page.goto('/keywords')
    
    // Find and click delete button for first keyword
    const deleteButton = page.getByRole('button', { name: /delete/i }).first()
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    
    // Should show confirmation dialog
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    await expect(page.getByText(/this action cannot be undone/i)).toBeVisible()
    
    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /confirm|delete/i })
    await confirmButton.click()
    
    // Should show success message
    await expect(page.getByText(/success/i)).toBeVisible()
    
    // Keyword should be removed from the list
    await expect(page.getByText('react')).not.toBeVisible()
  })

  test('should search and filter keywords', async ({ page }) => {
    await page.goto('/keywords')
    
    // Should show both keywords initially
    await expect(page.getByText('react')).toBeVisible()
    await expect(page.getByText('vue')).toBeVisible()
    
    // Search for specific keyword
    const searchInput = page.getByPlaceholder(/search keywords/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('react')
    
    // Should filter results
    await expect(page.getByText('react')).toBeVisible()
    await expect(page.getByText('vue')).not.toBeVisible()
    
    // Clear search
    await searchInput.clear()
    
    // Both keywords should be visible again
    await expect(page.getByText('react')).toBeVisible()
    await expect(page.getByText('vue')).toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/keywords')
    
    // Click add keyword button
    const addButton = page.getByRole('button', { name: /add keyword/i })
    await addButton.click()
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /save|create/i })
    await submitButton.click()
    
    // Should show validation errors
    await expect(page.getByText(/keyword is required/i)).toBeVisible()
    
    // Fill only keyword field
    await page.getByLabel(/keyword/i).fill('test')
    await submitButton.click()
    
    // Should still show description error if required
    // (This depends on your actual validation rules)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/v1/keywords', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    await page.goto('/keywords')
    
    // Try to create a keyword
    const addButton = page.getByRole('button', { name: /add keyword/i })
    await addButton.click()
    
    await page.getByLabel(/keyword/i).fill('test')
    await page.getByLabel(/description/i).fill('Test description')
    
    const submitButton = page.getByRole('button', { name: /save|create/i })
    await submitButton.click()
    
    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible()
    await expect(page.getByText(/internal server error/i)).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/keywords')
    
    // Tab through the interface
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to activate buttons with Enter/Space
    await page.keyboard.press('Enter')
    
    // Should open add keyword form
    await expect(page.getByText(/add new keyword/i)).toBeVisible()
    
    // Should be able to navigate form with Tab
    await page.keyboard.press('Tab')
    await page.keyboard.type('test-keyword')
    
    await page.keyboard.press('Tab')
    await page.keyboard.type('Test description')
  })
})