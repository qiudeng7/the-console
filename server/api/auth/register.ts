import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse, createErrorResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client";
import { User } from "#server/database/schema";
import { generateToken } from "#server/utils/jwt";
import { eq } from "drizzle-orm";

interface RegisterBody {
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

	let body: RegisterBody;
	try {
		body = await request.json() as RegisterBody;
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

	// 插入新用户
	const newUser = await drizzle
		.insert(User)
		.values({
			email: body.email,
			password: body.password, // 明文存储
		})
		.returning()
		.get();

	// 生成 JWT token
	const token = generateToken(newUser.id, env.JWT_SECRET);

	return createSuccessResponse({
		user: {
			id: newUser.id,
			email: newUser.email,
		},
		token
	});
});
