import { queue } from '../health.get'

export default defineEventHandler(async (event) => {
  const status = queue.getStatus()
  return { success: true, data: status }
})
