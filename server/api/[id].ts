import { defineMyHandler } from "../utils/myRouter";
import { createSuccessResponse } from "../utils/response";

export default defineMyHandler(({ routerParams }) => {
	console.log("routerParams:")
	console.log(routerParams)
	return createSuccessResponse({
		routerParams
	})
})