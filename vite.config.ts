import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { cloudflare } from "@cloudflare/vite-plugin"

function createAlias(aliasList: Record<string, string>) {
	const result: Record<string, string> = {}
	for (const [key, value] of Object.entries(aliasList)) {
		result[key] = fileURLToPath(new URL(value, import.meta.url))
	}
	return result
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		cloudflare()
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			...createAlias({
				"#server": "./server",
				"#drizzle-client": "./server/utils/drizzle/client"
			})
		},
	},
})
