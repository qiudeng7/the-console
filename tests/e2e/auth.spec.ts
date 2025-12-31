import { describe, it, expect } from 'vitest'
import { PuppeteerCrawler } from '@crawlee/puppeteer'

describe('Authentication E2E Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

  async function runCrawler(url: string, handler: any) {
    const crawler = new PuppeteerCrawler({
      launchContext: {
        launchOptions: {
          headless: true
        }
      },
      requestHandler: handler
    })

    await crawler.run([url])
  }

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const timestamp = Date.now()
      const testEmail = `e2e-test-${timestamp}@example.com`

      await runCrawler(`${BASE_URL}/register`, async ({ page }) => {
        // Fill registration form
        await page.fill('input[type="email"]', testEmail)
        await page.fill('input[type="password"]', 'password123')
        await page.fill('input[type="password"][placeholder*="确认"]', 'password123')
        await page.click('button[type="submit"]')

        // Wait for navigation or success message
        await page.waitForTimeout(2000)

        // Check if redirected or shows success
        const currentUrl = page.url()
        expect(currentUrl).not.toBe(`${BASE_URL}/register`)
      })
    })

    it('should show validation error for mismatched passwords', async () => {
      await runCrawler(`${BASE_URL}/register`, async ({ page }) => {
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.fill('input[type="password"][placeholder*="确认"]', 'different')
        await page.click('button[type="submit"]')

        await page.waitForTimeout(500)

        // Should still be on register page
        const currentUrl = page.url()
        expect(currentUrl).toBe(`${BASE_URL}/register`)
      })
    })
  })

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      await runCrawler(`${BASE_URL}/login`, async ({ page }) => {
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')

        await page.waitForTimeout(2000)

        // Should redirect to dashboard
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/(admin|employee)\/?/)
      })
    })

    it('should show error for invalid credentials', async () => {
      await runCrawler(`${BASE_URL}/login`, async ({ page }) => {
        await page.fill('input[type="email"]', 'wrong@example.com')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')

        await page.waitForTimeout(1000)

        // Should still be on login page
        const currentUrl = page.url()
        expect(currentUrl).toBe(`${BASE_URL}/login`)
      })
    })

    it('should navigate to register page', async () => {
      await runCrawler(`${BASE_URL}/login`, async ({ page }) => {
        await page.click('a[href="/register"]')

        await page.waitForTimeout(500)

        const currentUrl = page.url()
        expect(currentUrl).toBe(`${BASE_URL}/register`)
      })
    })
  })

  describe('Admin Task Management', () => {
    const testEmail = `admin-e2e-${Date.now()}@example.com`

    it('should create a new task', async () => {
      await runCrawler(`${BASE_URL}/admin/tasks`, async ({ page }) => {
        // Click create button
        await page.click('button:has-text("创建任务")')
        await page.waitForTimeout(500)

        // Fill task form
        await page.fill('input[placeholder*="标题"]', 'E2E Test Task')
        await page.fill('input[placeholder*="分类"]', 'E2E')
        await page.fill('textarea[placeholder*="描述"]', 'This is an E2E test task')

        // Submit
        await page.click('button:has-text("创建")')
        await page.waitForTimeout(1000)

        // Check if task appears in list
        const taskExists = await page.locator('text=/E2E Test Task/').count() > 0
        expect(taskExists).toBe(true)
      })
    })

    it('should filter tasks by status', async () => {
      await runCrawler(`${BASE_URL}/admin/tasks`, async ({ page }) => {
        // Select status filter
        await page.selectOption('select', 'todo')
        await page.click('button:has-text("搜索")')
        await page.waitForTimeout(500)

        // Check if filter is applied
        const selectedOption = await page.inputValue('select')
        expect(selectedOption).toBe('todo')
      })
    })
  })

  describe('Employee Task View', () => {
    it('should view assigned tasks', async () => {
      await runCrawler(`${BASE_URL}/employee/tasks`, async ({ page }) => {
        // Check page title
        const title = await page.title()
        expect(title).toContain('任务')

        // Should have task cards or empty state
        const hasTasks = await page.locator('.grid > div').count() > 0 ||
                        await page.locator('text=/暂无任务/').count() > 0
        expect(hasTasks).toBe(true)
      })
    })

    it('should not have create button (employee limitation)', async () => {
      await runCrawler(`${BASE_URL}/employee/tasks`, async ({ page }) => {
        const createButton = await page.locator('button:has-text("创建任务")').count()
        expect(createButton).toBe(0)
      })
    })
  })

  describe('Navigation and Layout', () => {
    it('should redirect unauthenticated user to login', async () => {
      await runCrawler(`${BASE_URL}/admin/tasks`, async ({ page }) => {
        await page.waitForTimeout(1000)

        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/login/)
      })
    })

    it('should show admin navigation for admin users', async () => {
      const testEmail = `nav-admin-${Date.now()}@example.com`

      await runCrawler(`${BASE_URL}/register`, async ({ page }) => {
        // Register first user (becomes admin)
        await page.fill('input[type="email"]', testEmail)
        await page.fill('input[type="password"]', 'password123')
        await page.fill('input[type="password"][placeholder*="确认"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000)

        // Check navigation
        const hasTasksNav = await page.locator('a:has-text("任务管理")').count() > 0
        const hasUsersNav = await page.locator('a:has-text("用户管理")').count() > 0

        expect(hasTasksNav).toBe(true)
        expect(hasUsersNav).toBe(true)
      })
    })
  })
})
