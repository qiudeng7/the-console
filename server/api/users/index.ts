/**
 * 用户管理 API
 *
 * GET /api/users - 获取用户列表
 *
 * 认证：需要 Bearer Token + admin 权限
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq, like } from "drizzle-orm";

export default defineMyHandler(async ({ request, env }) => {
	const authHeader = request.headers.get('Authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		return createErrorResponse({
			message: '未认证',
			options: { status: 401 }
		});
	}

	const userId = verifyToken(token, env.JWT_SECRET);

	if (!userId) {
		return createErrorResponse({
			message: 'Token 无效或已过期',
			options: { status: 401 }
		});
	}

	const drizzle = getDrizzleClient(env);

	// 获取当前用户信息并检查权限
	const currentUser = await drizzle
		.select()
		.from(User)
		.where(eq(User.id, userId))
		.get();

	if (!currentUser) {
		return createErrorResponse({
			message: '用户不存在',
			options: { status: 404 }
		});
	}

	// 权限检查：只有 admin 可以访问
	if (currentUser.role !== 'admin') {
		return createErrorResponse({
			message: '需要管理员权限',
			options: { status: 403 }
		});
	}

	// ============================================================
	// GET /api/users - 获取用户列表
	// ============================================================
	// Query 参数：
	//   page      - 页码（默认 1）
	//   pageSize  - 每页数量（默认 10）
	//   role      - 角色筛选
	//   search    - 搜索邮箱
	//
	// 响应：
	// {
	//   success: true,
	//   data: {
	//     users: User[],
	//     total: number,
	//     page: number,
	//     pageSize: number
	//   }
	// }
	if (request.method === 'GET') {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
		const role = url.searchParams.get('role');
		const search = url.searchParams.get('search');

		const conditions = [
			eq(User.deletedAt, '')
		];

		if (role) {
			conditions.push(eq(User.role, role));
		}

		if (search) {
			conditions.push(like(User.email, `%${search}%`));
		}

		const users = await drizzle
			.select()
			.from(User)
			.where(conditions.length > 1 ? conditions[0] : conditions[0])
			.limit(pageSize)
			.offset((page - 1) * pageSize)
			.all();

		// 获取总数
		const allUsers = await drizzle
			.select()
			.from(User)
			.where(eq(User.deletedAt, ''))
			.all();

		const filteredUsers = allUsers.filter(user => {
			if (role && user.role !== role) return false;
			if (search && !user.email.includes(search)) return false;
			return true;
		});

		const total = filteredUsers.length;

		return createSuccessResponse({
			users,
			total,
			page,
			pageSize
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
