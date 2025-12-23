/**
 * 任务列表 API
 *
 * GET  /api/tasks - 获取任务列表（支持分页、筛选、搜索）
 * POST /api/tasks - 创建新任务
 *
 * 认证：所有接口都需要 Bearer Token
 */

import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { Task, User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq, and, like, or } from "drizzle-orm";

interface CreateTaskBody {
	title: string;
	category?: string;
	tag?: string;
	description?: string;
	status?: string;
	assignedToUserId?: number;
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

	// 获取当前用户信息
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

	// ============================================================
	// GET /api/tasks - 获取任务列表
	// ============================================================
	// Query 参数：
	//   page      - 页码（默认 1）
	//   pageSize  - 每页数量（默认 10）
	//   status    - 状态筛选（todo/in_progress/in_review/done/cancelled）
	//   category  - 分类筛选
	//   search    - 搜索关键词（匹配标题和描述）
	//
	// 响应：
	// {
	//   success: true,
	//   data: {
	//     tasks: Task[],
	//     total: number,
	//     page: number,
	//     pageSize: number
	//   }
	// }
	// 权限：
	//   - admin: 看到自己创建的任务
	//   - employee: 只能看到分配给自己的任务
	if (request.method === 'GET') {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
		const status = url.searchParams.get('status');
		const category = url.searchParams.get('category');
		const search = url.searchParams.get('search');

		const conditions = [
			eq(Task.deletedAt, '')
		];

		// 根据角色设置不同的查询条件
		if (currentUser.role === 'employee') {
			// 员工只能看到分配给自己的任务
			conditions.push(eq(Task.assignedToUserId, userId));
		} else {
			// admin 看到自己创建的任务
			conditions.push(eq(Task.createdByUserId, userId));
		}

		if (status) {
			conditions.push(eq(Task.status, status));
		}

		if (category) {
			conditions.push(eq(Task.category, category));
		}

		if (search) {
			conditions.push(
				or(
					like(Task.title, `%${search}%`),
					like(Task.description, `%${search}%`)
				)!
			);
		}

		const tasks = await drizzle
			.select()
			.from(Task)
			.where(and(...conditions))
			.limit(pageSize)
			.offset((page - 1) * pageSize)
			.all();

		// 获取总数（用于分页）
		const totalResult = await drizzle
			.select({ count: Task.id })
			.from(Task)
			.where(and(...conditions))
			.all();

		const total = totalResult.length;

		return createSuccessResponse({
			tasks,
			total,
			page,
			pageSize
		});
	}

	// ============================================================
	// POST /api/tasks - 创建新任务
	// ============================================================
	// 请求体：
	// {
	//   title: string,           // 必填
	//   category?: string,
	//   tag?: string,
	//   description?: string,
	//   status?: string,         // 默认 'todo'
	//   assignedToUserId?: number
	// }
	//
	// 响应：
	// {
	//   success: true,
	//   data: { task: Task }
	// }
	// 权限：只有 admin 可以创建任务
	if (request.method === 'POST') {
		// 权限检查：员工不能创建任务
		if (currentUser.role === 'employee') {
			return createErrorResponse({
				message: '员工不能创建任务',
				options: { status: 403 }
			});
		}
		let body: CreateTaskBody;
		try {
			body = await request.json() as CreateTaskBody;
		} catch (e) {
			return createErrorResponse({
				message: '无效的 JSON 格式',
				options: { status: 400 }
			});
		}

		if (!body.title) {
			return createErrorResponse({
				message: '任务标题不能为空',
				options: { status: 400 }
			});
		}

		const now = new Date().toLocaleString();

		const newTask = await drizzle
			.insert(Task)
			.values({
				title: body.title,
				category: body.category || null,
				tag: body.tag || null,
				description: body.description || null,
				status: body.status || 'todo',
				createdByUserId: userId,
				assignedToUserId: body.assignedToUserId || null,
				createdAt: now,
				updatedAt: now,
				deletedAt: '',
			})
			.returning()
			.get();

		return createSuccessResponse({
			task: newTask
		});
	}

	return createErrorResponse({
		message: '方法不允许',
		options: { status: 405 }
	});
});
