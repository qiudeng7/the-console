export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'

export interface Task {
	id: number
	title: string
	category: string | null
	tag: string | null
	description: string | null
	status: TaskStatus
	createdByUserId: number
	assignedToUserId: number | null
	createdAt: string
	updatedAt: string
}

export interface TaskStats {
	byStatus: Record<string, number>
	byCategory: Record<string, number>
	byAssignee: Record<number, number>
	total: number
}

export interface TaskListParams {
	page?: number
	pageSize?: number
	status?: TaskStatus
	category?: string
	search?: string
}

export interface TaskListResponse {
	tasks: Task[]
	total: number
	page: number
	pageSize: number
}
