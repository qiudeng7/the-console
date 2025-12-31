import { defineConfig } from 'crawlee'

export default defineConfig({
  requestHandlerTimeoutSecs: 30,
  browserPoolOptions: {
    maxOpenPagesPerBrowser: 1
  },
  // Set the log level
  logLevel: process.env.CRAWLEE_LOG_LEVEL ?? 'INFO',
})
