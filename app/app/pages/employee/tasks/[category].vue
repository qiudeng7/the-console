<script setup lang="ts">
import type { Task, TaskListParams } from '~~/types'
import { EMPLOYEE_TASK_TYPES } from '~~/app/config/employee-task-types'

definePageMeta({
  layout: 'employee'
})

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const category = route.params.category as string

// 获取任务类型配置
const taskTypeConfig = EMPLOYEE_TASK_TYPES.find(t => t.category === category)

// 验证任务类型是否存在
if (!taskTypeConfig) {
  throw createError({
    statusCode: 404,
    message: '未找到该任务类型',
    fatal: true
  })
}

const currentTask = ref<Task | null>(null)
const formData = ref<Record<string, any>>({})
const loading = ref(false)
const submitted = ref(false)
const allCompleted = ref(false)

// 加载当前任务
async function loadCurrentTask() {
  loading.value = true
  try {
    const filters: TaskListParams = {
      category,
      status: 'todo',
      page: 1,
      pageSize: 1
    }

    await taskStore.fetchTasks(filters)

    if (taskStore.tasks.length > 0 && taskStore.tasks[0]) {
      currentTask.value = taskStore.tasks[0] as Task
      initializeFormData()
    } else {
      allCompleted.value = true
      currentTask.value = null
    }
  } catch (error: any) {
    console.error('加载任务失败:', error)
    alert(error.message || '加载任务失败')
  } finally {
    loading.value = false
  }
}

// 初始化表单数据
function initializeFormData() {
  const config = EMPLOYEE_TASK_TYPES.find(t => t.category === category)
  if (!config?.formFields) return

  formData.value = {}
  config.formFields.forEach((field: any) => {
    formData.value[field.name] = field.defaultValue ?? getDefaultValueByType(field.type)
  })
}

function getDefaultValueByType(type: string) {
  switch (type) {
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'date':
      return new Date().toISOString().split('T')[0]
    default:
      return ''
  }
}

// 提交表单
async function handleSubmit() {
  if (!currentTask.value) return

  loading.value = true
  try {
    // 1. 构建结果数据
    const resultData = {
      type: category,
      submittedAt: new Date().toISOString(),
      fields: formData.value
    }

    // 2. 更新任务状态
    const resultString = JSON.stringify(resultData, null, 2)
    const newDescription = currentTask.value.description
      ? `${currentTask.value.description}\n\n### 完成结果\n${resultString}`
      : resultString

    await taskStore.updateTask(currentTask.value.id, {
      status: 'done',
      description: newDescription
    })

    // 3. 标记为已提交
    submitted.value = true

    // 4. 延迟后加载下一个任务
    setTimeout(async () => {
      submitted.value = false
      await loadCurrentTask()
    }, 1500)
  } catch (error: any) {
    console.error('提交失败:', error)
    alert(error.message || '提交失败，请重试')
  } finally {
    loading.value = false
  }
}

// 返回列表
function backToList() {
  router.push('/employee/tasks')
}

onMounted(() => {
  loadCurrentTask()
})

// 页面标题
useHead({
  title: `${taskTypeConfig.name} - 员工工作台`
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ taskTypeConfig.name }}
      </h1>
      <p v-if="taskTypeConfig.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ taskTypeConfig.description }}
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !currentTask" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <!-- 全部完成 -->
    <TaskCompletionMessage
      v-else-if="allCompleted"
      :task-type-name="taskTypeConfig.name"
      @refresh="loadCurrentTask"
      @back-to-list="backToList"
    />

    <!-- 任务详情和表单 -->
    <div v-else-if="currentTask" class="space-y-6">
      <!-- 提交成功提示 -->
      <div
        v-if="submitted"
        class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4 mb-6"
      >
        <div class="flex">
          <svg
            class="h-5 w-5 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800 dark:text-green-200">
              任务已完成！正在加载下一个任务...
            </p>
          </div>
        </div>
      </div>

      <!-- 任务详情 -->
      <TaskDetail :task="currentTask" />

      <!-- 任务表单 -->
      <TaskForm
        v-if="taskTypeConfig.requiresForm"
        :fields="taskTypeConfig.formFields || []"
        v-model="formData"
        :disabled="submitted"
        :loading="loading || submitted"
        @submit="handleSubmit"
      />

      <!-- 简单完成按钮（不需要表单时） -->
      <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <button
          @click="handleSubmit"
          :disabled="loading || submitted"
          class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="submitted || loading"
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ submitted ? '已完成' : '完成任务' }}
        </button>
      </div>
    </div>
  </div>
</template>
