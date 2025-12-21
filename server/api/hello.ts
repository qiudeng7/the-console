import { defineFetchHandler } from "../utils/defineFetchHandler";

export default defineFetchHandler(async (request, env, context) => {
	return new Response("hello")
})