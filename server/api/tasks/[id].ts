/**
 * 任务详情 API
 *
 * GET    /api/tasks/:id - 获取单个任务详情
 * PUT    /api/tasks/:id - 更新任务
 * DELETE /api/tasks/:id - 删除任务（软删除）
 *
 * 认证：所有接口都需要 Bearer Token
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { Task } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq, and } from "drizzle-orm";

interface UpdateTaskBody {
	title?: string;
	category?: string;
	tag?: string;
	description?: string;
	status?: string;
	assignedToUserId?: number;
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

	const taskId = parseInt(routerParams.id);
	if (isNaN(taskId)) {
		return createErrorResponse({
			message: '无效的任务 ID',
			options: { status: 400 }
		});
	}

	const drizzle = getDrizzleClient(env);

	// ============================================================
	// GET /api/tasks/:id - 获取单个任务详情
	// ============================================================
	// 响应：
	// {
	//   success: true,
	//   data: { task: Task }
	// }
	if (request.method === 'GET') {
		const task = await drizzle
			.select()
			.from(Task)
			.where(and(
				eq(Task.id, taskId),
				eq(Task.deletedAt, '')
			))
			.get();

		if (!task) {
			return createErrorResponse({
				message: '任务不存在',
				options: { status: 404 }
			});
		}

		return createSuccessResponse({
			task
		});
	}

	// ============================================================
	// PUT /api/tasks/:id - 更新任务
	// ============================================================
	// 请求体：
	// {
	//   title?: string,
	//   category?: string,
	//   tag?: string,
	//   description?: string,
	//   status?: string,
	//   assignedToUserId?: number
	// }
	// 响应：
	// {
	//   success: true,
	//   data: { task: Task }
	// }
	// 权限：只有任务创建者可以修改
	if (request.method === 'PUT') {
		let body: UpdateTaskBody;
		try {
			body = await request.json() as UpdateTaskBody;
		} catch (e) {
			return createErrorResponse({
				message: '无效的 JSON 格式',
				options: { status: 400 }
			});
		}

		// 检查任务是否存在
		const existingTask = await drizzle
			.select()
			.from(Task)
			.where(eq(Task.id, taskId))
			.get();

		if (!existingTask) {
			return createErrorResponse({
				message: '任务不存在',
				options: { status: 404 }
			});
		}

		// 权限检查：只有创建者可以修改
		if (existingTask.createdByUserId !== userId) {
			return createErrorResponse({
				message: '无权限修改此任务',
				options: { status: 403 }
			});
		}

		const now = new Date().toLocaleString();

		const updatedTask = await drizzle
			.update(Task)
			.set({
				...(body.title !== undefined && { title: body.title }),
				...(body.category !== undefined && { category: body.category }),
				...(body.tag !== undefined && { tag: body.tag }),
				...(body.description !== undefined && { description: body.description }),
				...(body.status !== undefined && { status: body.status }),
				...(body.assignedToUserId !== undefined && { assignedToUserId: body.assignedToUserId }),
				updatedAt: now,
			})
			.where(eq(Task.id, taskId))
			.returning()
			.get();

		return createSuccessResponse({
			task: updatedTask
		});
	}

	// ============================================================
	// DELETE /api/tasks/:id - 删除任务（软删除）
	// ============================================================
	// 响应：
	// {
	//   success: true,
	//   data: { message: '任务已删除' }
	// }
	// 权限：只有任务创建者可以删除
	if (request.method === 'DELETE') {
		const existingTask = await drizzle
			.select()
			.from(Task)
			.where(eq(Task.id, taskId))
			.get();

		if (!existingTask) {
			return createErrorResponse({
				message: '任务不存在',
				options: { status: 404 }
			});
		}

		// 权限检查：只有创建者可以删除
		if (existingTask.createdByUserId !== userId) {
			return createErrorResponse({
				message: '无权限删除此任务',
				options: { status: 403 }
			});
		}

		const now = new Date().toLocaleString();

		await drizzle
			.update(Task)
			.set({
				deletedAt: now,
				updatedAt: now,
			})
			.where(eq(Task.id, taskId));

		return createSuccessResponse({
			message: '任务已删除'
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
