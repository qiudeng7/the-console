import { defineFetchHandler } from "../utils/defineFetchHandler";

export default defineFetchHandler(async (request, env, context) => {
	const params = (request as any).params || {};
	const userId = params.id;

	if (!userId) {
		return new Response(
			JSON.stringify({ error: '缺少用户 ID 参数' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	if (request.method === 'GET') {
		// 模拟用户数据
		const userData = {
			id: userId,
			name: `用户 ${userId}`,
			email: `user${userId}@example.com`,
			createdAt: '2025-01-01T00:00:00Z'
		};

		return new Response(
			JSON.stringify({
				message: '获取用户信息成功',
				user: userData,
				timestamp: new Date().toISOString()
			}),
			{
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	return new Response(
		JSON.stringify({ error: '方法不允许' }),
		{
			status: 405,
			headers: { 'Content-Type': 'application/json' }
		}
	);
});