import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { generateToken } from "#server/utils/jwt";
import { eq } from "drizzle-orm";

interface LoginBody {
	email: string;
	password: string;
}

export default defineMyHandler(async ({ request, env }) => {
	// 只支持 POST 请求
	if (request.method !== 'POST') {
		return createErrorResponse({
			message: '方法不允许',
			options: { status: 405 }
		});
	}

	let body: LoginBody;
	try {
		body = await request.json() as LoginBody;
	} catch (e) {
		return createErrorResponse({
			message: '无效的 JSON 格式',
			options: { status: 400 }
		});
	}

	// 简单验证
	if (!body.email || !body.password) {
		return createErrorResponse({
			message: '邮箱和密码不能为空',
			options: { status: 400 }
		});
	}

	const drizzle = getDrizzleClient(env);

	// 查找用户
	const user = await drizzle
		.select()
		.from(User)
		.where(eq(User.email, body.email))
		.get();

	if (!user) {
		return createErrorResponse({
			message: '邮箱或密码错误',
			options: { status: 401 }
		});
	}

	// 验证密码（明文比较）
	if (user.password !== body.password) {
		return createErrorResponse({
			message: '邮箱或密码错误',
			options: { status: 401 }
		});
	}

	// 生成 JWT token
	const token = generateToken(user.id, env.JWT_SECRET);

	return createSuccessResponse({
		user: {
			id: user.id,
			email: user.email,
			role: user.role,
		},
		token
	});
});
