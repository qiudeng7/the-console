/**
 * 单个用户操作 API
 *
 * GET    /api/users/:id - 获取单个用户
 * PUT    /api/users/:id - 更新用户（角色切换）
 * DELETE /api/users/:id - 删除用户（软删除）
 *
 * 认证：需要 Bearer Token + admin 权限
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq, and } from "drizzle-orm";

interface UpdateUserBody {
	role?: 'admin' | 'employee';
}

export default defineMyHandler(async ({ request, env, routerParams }) => {
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

	const targetUserId = parseInt(routerParams.id);
	if (isNaN(targetUserId)) {
		return createErrorResponse({
			message: '无效的用户 ID',
			options: { status: 400 }
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
	// GET /api/users/:id - 获取单个用户
	// ============================================================
	if (request.method === 'GET') {
		const user = await drizzle
			.select()
			.from(User)
			.where(and(eq(User.id, targetUserId), eq(User.deletedAt, '')))
			.get();

		if (!user) {
			return createErrorResponse({
				message: '用户不存在',
				options: { status: 404 }
			});
		}

		return createSuccessResponse({
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt,
			}
		});
	}

	// ============================================================
	// PUT /api/users/:id - 更新用户
	// ============================================================
	// 请求体：
	// {
	//   role?: 'admin' | 'employee'
	// }
	//
	// 响应：
	// {
	//   success: true,
	//   data: { user: User }
	// }
	if (request.method === 'PUT') {
		let body: UpdateUserBody;
		try {
			body = await request.json() as UpdateUserBody;
		} catch (e) {
			return createErrorResponse({
				message: '无效的 JSON 格式',
				options: { status: 400 }
			});
		}

		// 检查目标用户是否存在
		const targetUser = await drizzle
			.select()
			.from(User)
			.where(eq(User.id, targetUserId))
			.get();

		if (!targetUser) {
			return createErrorResponse({
				message: '用户不存在',
				options: { status: 404 }
			});
		}

		// 不能修改自己的角色
		if (targetUserId === userId) {
			return createErrorResponse({
				message: '不能修改自己的角色',
				options: { status: 400 }
			});
		}

		const now = new Date().toLocaleString();

		const updatedUser = await drizzle
			.update(User)
			.set({
				...(body.role !== undefined && { role: body.role }),
			})
			.where(eq(User.id, targetUserId))
			.returning()
			.get();

		return createSuccessResponse({
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				role: updatedUser.role,
				createdAt: updatedUser.createdAt,
			}
		});
	}

	// ============================================================
	// DELETE /api/users/:id - 删除用户（软删除）
	// ============================================================
	// 响应：
	// {
	//   success: true,
	//   data: { message: '用户已删除' }
	// }
	if (request.method === 'DELETE') {
		const targetUser = await drizzle
			.select()
			.from(User)
			.where(eq(User.id, targetUserId))
			.get();

		if (!targetUser) {
			return createErrorResponse({
				message: '用户不存在',
				options: { status: 404 }
			});
		}

		// 不能删除自己
		if (targetUserId === userId) {
			return createErrorResponse({
				message: '不能删除自己',
				options: { status: 400 }
			});
		}

		const now = new Date().toLocaleString();

		await drizzle
			.update(User)
			.set({
				deletedAt: now,
			})
			.where(eq(User.id, targetUserId));

		return createSuccessResponse({
			message: '用户已删除'
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
