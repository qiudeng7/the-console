export type UserRole = 'admin' | 'employee'

export interface User {
  id: number
  email: string
  password: string
  role: UserRole
  createdAt: string
  deletedAt: string
}

export interface AuthUser {
  id: number
  email: string
  role: UserRole
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  role?: UserRole
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

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

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 员工端任务类型相关
export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date'
  required?: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: any
}

export interface EmployeeTaskType {
  name: string
  category: string
  route: string
  icon: string
  requiresForm: boolean
  formFields?: FormField[]
  description?: string
}
