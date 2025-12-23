/**
 * 用户管理 API
 *
 * GET    /api/users - 获取用户列表
 * POST   /api/users - 创建用户
 *
 * 认证：需要 Bearer Token + admin 权限
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq, like, and } from "drizzle-orm";

interface CreateUserBody {
	email: string;
	password: string;
	role?: 'admin' | 'employee';
}

interface UpdateUserBody {
	role?: 'admin' | 'employee';
}

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

	// ============================================================
	// POST /api/users - 创建用户
	// ============================================================
	// 请求体：
	// {
	//   email: string,      // 必填
	//   password: string,   // 必填
	//   role?: string       // 可选，默认 'employee'
	// }
	//
	// 响应：
	// {
	//   success: true,
	//   data: { user: User }
	// }
	if (request.method === 'POST') {
		let body: CreateUserBody;
		try {
			body = await request.json() as CreateUserBody;
		} catch (e) {
			return createErrorResponse({
				message: '无效的 JSON 格式',
				options: { status: 400 }
			});
		}

		if (!body.email || !body.password) {
			return createErrorResponse({
				message: '邮箱和密码不能为空',
				options: { status: 400 }
			});
		}

		// 检查邮箱是否已存在
		const existingUser = await drizzle
			.select()
			.from(User)
			.where(eq(User.email, body.email))
			.get();

		if (existingUser) {
			return createErrorResponse({
				message: '邮箱已被注册',
				options: { status: 409 }
			});
		}

		const now = new Date().toLocaleString();

		const newUser = await drizzle
			.insert(User)
			.values({
				email: body.email,
				password: body.password,
				role: body.role || 'employee',
				createdAt: now,
				deletedAt: '',
			})
			.returning()
			.get();

		return createSuccessResponse({
			user: {
				id: newUser.id,
				email: newUser.email,
				role: newUser.role,
				createdAt: newUser.createdAt,
			}
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
