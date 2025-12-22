import { defineMyHandler } from "#server/utils/myRouter";
import { createSuccessResponse } from "#server/utils/response";
import { getDrizzleClient } from "#drizzle-client"
import { Task, User } from "#server/database/schema";

export default defineMyHandler(({ routerParams, env }) => {
	console.log("routerParams:")
	console.log(routerParams)

	const drizzle = getDrizzleClient(env)

	const result = drizzle.select().from(Task).all()

	return createSuccessResponse({
		routerParams,
		result
	})
})