import { defineFetchHandler } from "../utils/defineFetchHandler";

export default defineFetchHandler(async (request, env, context) => {
	const params = (request as any).params || {};
	const id = params.id;

	if (!id) {
		return new Response(
			JSON.stringify({ error: '缺少 ID 参数' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	if (request.method === 'GET') {
		return new Response(
			JSON.stringify({
				message: '获取资源',
				id: id,
				timestamp: new Date().toISOString()
			}),
			{
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	if (request.method === 'DELETE') {
		return new Response(
			JSON.stringify({
				message: '删除资源成功',
				id: id,
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