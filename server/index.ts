import { handleMyRoute } from './utils/myRouter';

export default {
	fetch: async function (request, env, ctx) {
		return await handleMyRoute(request, env, ctx);
	}

} satisfies ExportedHandler<Env>;