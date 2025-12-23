import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { verifyToken, extractTokenFromHeader } from "#server/utils/jwt";
import { eq } from "drizzle-orm";

export default defineMyHandler(async ({ request, env }) => {
	// 只支持 GET 请求
	if (request.method !== 'GET') {
		return createErrorResponse({
			message: '方法不允许',
			options: { status: 405 }
		});
	}

	// 从 Authorization 头提取 token
	const authHeader = request.headers.get('Authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		return createErrorResponse({
			message: '未认证',
			options: { status: 401 }
		});
	}

	// 验证 token
	const userId = verifyToken(token, env.JWT_SECRET);

	if (!userId) {
		return createErrorResponse({
			message: 'Token 无效或已过期',
			options: { status: 401 }
		});
	}

	// 查询用户信息
	const drizzle = getDrizzleClient(env);
	const user = await drizzle
		.select()
		.from(User)
		.where(eq(User.id, userId))
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
		}
	});
});
