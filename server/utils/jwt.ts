import jwt from 'jsonwebtoken'

/**
 * 生成 JWT token
 * @param userId - 用户ID
 * @param secret - JWT 密钥
 * @returns JWT token 字符串
 */
export function generateToken(userId: number, secret: string): string {
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' } // token 有效期 7 天
  )
}

/**
 * 验证 JWT token
 * @param token - JWT token 字符串
 * @param secret - JWT 密钥
 * @returns 用户ID，验证失败返回 null
 */
export function verifyToken(token: string, secret: string): number | null {
  try {
    const decoded = jwt.verify(token, secret) as { userId: number }
    return decoded.userId
  } catch {
    return null
  }
}

/**
 * 从 Authorization 头中提取 token
 * @param authHeader - Authorization 请求头的值
 * @returns token 字符串，格式无效返回 null
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
