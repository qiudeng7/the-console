import { describe, it, expect, beforeEach } from 'vitest'
import { generateToken, verifyToken, extractTokenFromHeader } from './jwt'

describe('JWT Utils', () => {
  const testSecret = 'test-secret-key'
  const testUserId = 123

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testUserId, testSecret)
      expect(token).toBeTypeOf('string')
      expect(token.length).toBeGreaterThan(0)
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different users', () => {
      const token1 = generateToken(1, testSecret)
      const token2 = generateToken(2, testSecret)
      expect(token1).not.toBe(token2)
    })

    it('should include userId in token payload', () => {
      const token = generateToken(testUserId, testSecret)
      const payload = JSON.parse(atob(token.split('.')[1]))
      expect(payload.userId).toBe(testUserId)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token and return userId', () => {
      const token = generateToken(testUserId, testSecret)
      const userId = verifyToken(token, testSecret)
      expect(userId).toBe(testUserId)
    })

    it('should return null for invalid token', () => {
      const userId = verifyToken('invalid-token', testSecret)
      expect(userId).toBeNull()
    })

    it('should return null for token with wrong secret', () => {
      const token = generateToken(testUserId, testSecret)
      const userId = verifyToken(token, 'wrong-secret')
      expect(userId).toBeNull()
    })

    it('should return null for expired token', () => {
      // Create an expired token (using a very short expiry)
      const jwt = require('jsonwebtoken')
      const expiredToken = jwt.sign({ userId: testUserId }, testSecret, { expiresIn: '0s' })
      const userId = verifyToken(expiredToken, testSecret)
      expect(userId).toBeNull()
    }, 2000)
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token-123'
      const header = `Bearer ${token}`
      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for null header', () => {
      const extracted = extractTokenFromHeader(null)
      expect(extracted).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token')
      expect(extracted).toBeNull()
    })

    it('should return null for empty string header', () => {
      const extracted = extractTokenFromHeader('')
      expect(extracted).toBeNull()
    })

    it('should handle Bearer with no token', () => {
      const extracted = extractTokenFromHeader('Bearer ')
      expect(extracted).toBe('')
    })
  })
})
