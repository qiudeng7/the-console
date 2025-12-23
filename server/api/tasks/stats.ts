/**
 * 任务统计 API
 *
 * GET /api/tasks/stats - 获取任务统计数据
 *
 * 认证：需要 Bearer Token + admin 权限
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { Task, User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq } from "drizzle-orm";

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
	// GET /api/tasks/stats - 获取任务统计数据
	// ============================================================
	// 响应：
	// {
	//   success: true,
	//   data: {
	//     byStatus: { todo: 10, inProgress: 5, ... },
	//     byCategory: { dev: 8, design: 7, ... },
	//     byAssignee: { userId1: 5, userId2: 3, ... },
	//     total: 25
	//   }
	// }
	if (request.method === 'GET') {
		// 获取所有未删除的任务
		const allTasks = await drizzle
			.select()
			.from(Task)
			.where(eq(Task.deletedAt, ''))
			.all();

		// 按状态统计
		const byStatus: Record<string, number> = {
			todo: 0,
			in_progress: 0,
			in_review: 0,
			done: 0,
			cancelled: 0
		};

		// 按分类统计
		const byCategory: Record<string, number> = {};

		// 按执行人统计
		const byAssignee: Record<number, number> = {};

		allTasks.forEach(task => {
			// 状态统计
			if (task.status) {
				byStatus[task.status] = (byStatus[task.status] || 0) + 1;
			}

			// 分类统计
			if (task.category) {
				byCategory[task.category] = (byCategory[task.category] || 0) + 1;
			}

			// 执行人统计
			if (task.assignedToUserId) {
				byAssignee[task.assignedToUserId] = (byAssignee[task.assignedToUserId] || 0) + 1;
			}
		});

		return createSuccessResponse({
			byStatus,
			byCategory,
			byAssignee,
			total: allTasks.length
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
