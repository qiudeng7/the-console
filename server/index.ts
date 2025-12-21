import { handleMyRoute } from './utils/myRouter';

export default {
	fetch: async function (request, env, ctx) {
		
		const a = Response.json({
			mesage: "hello"
		})
		const res = await handleMyRoute(request, env, ctx);
		
		return res
	}

} satisfies ExportedHandler<Env>;