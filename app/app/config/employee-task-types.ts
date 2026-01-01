/**
 * 员工端任务类型配置
 *
 * 通过添加新对象到 EMPLOYEE_TASK_TYPES 数组来添加新的任务类型
 * 侧边栏会自动显示新入口，无需修改其他代码
 */

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
  name: string              // 显示名称
  category: string          // 任务分类标识（对应Task.category字段）
  route: string             // 路由路径
  icon: string              // SVG图标路径
  requiresForm: boolean     // 是否需要填写表单
  formFields?: FormField[]  // 表单字段配置
  description?: string      // 任务类型说明
}

/**
 * 员工端任务类型配置
 *
 * 示例：添加新的任务类型
 * {
 *   name: '代码审查',
 *   category: 'review',
 *   route: '/employee/tasks/review',
 *   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
 *   requiresForm: true,
 *   formFields: [
 *     { name: 'reviewComment', label: '审查意见', type: 'textarea', required: true },
 *     { name: 'approved', label: '是否通过', type: 'boolean', required: true }
 *   ]
 * }
 */
export const EMPLOYEE_TASK_TYPES: EmployeeTaskType[] = [
  {
    name: '测试任务',
    category: 'testing',
    route: '/employee/tasks/testing',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    requiresForm: true,
    description: '执行测试用例并记录测试结果',
    formFields: [
      {
        name: 'testResult',
        label: '测试结果',
        type: 'textarea',
        required: true,
        placeholder: '请详细描述测试过程和结果...'
      },
      {
        name: 'bugs',
        label: '发现的Bug数量',
        type: 'number',
        required: true,
        defaultValue: 0
      },
      {
        name: 'environment',
        label: '测试环境',
        type: 'select',
        required: true,
        options: ['开发环境', '测试环境', '预发布环境', '生产环境'],
        defaultValue: '测试环境'
      }
    ]
  }
]
