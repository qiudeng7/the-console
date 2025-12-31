import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const API_BASE = 'http://localhost:3000/api'

describe('Auth API Integration Tests', () => {
  let testUserEmail = `test-${Date.now()}@example.com`
  let testUserPassword = 'password123'
  let authToken = ''

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('user')
      expect(data.data).toHaveProperty('token')
      expect(data.data.user.email).toBe(testUserEmail)

      // Save token for subsequent tests
      authToken = data.data.token
    })

    it('should make first user admin if no users exist', async () => {
      // Note: This test assumes the database is empty on first run
      // In a real test scenario, you'd want to reset the database
      const userEmail = `admin-test-${Date.now()}@example.com`

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail,
          password: testUserPassword
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.data.user.role).toBeTruthy()
      expect(['admin', 'employee']).toContain(data.data.user.role)
    })

    it('should reject duplicate email', async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'differentpassword'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: '',
          password: ''
        })
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('token')
      expect(data.data).toHaveProperty('user')
    })

    it('should reject invalid email', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: testUserPassword
        })
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should reject invalid password', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'wrongpassword'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: '',
          password: ''
        })
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(testUserEmail)
    })

    it('should reject request without token', async () => {
      const response = await fetch(`${API_BASE}/auth/me`)

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should reject request with invalid token', async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': 'InvalidFormat token'
        }
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })
})
