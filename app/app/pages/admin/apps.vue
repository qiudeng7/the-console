<script setup lang="ts">
import { useAuthStore } from '~~/app/stores/auth'

definePageMeta({
  layout: 'admin',
  requiresAdmin: true
})

const authStore = useAuthStore()

// 表格列表及其字段定义
const tables = ref([
  {
    name: 'users',
    displayName: '用户',
    fields: [
      { name: 'email', type: 'email', required: true },
      { name: 'password', type: 'password', required: true },
      { name: 'role', type: 'role', required: false }
    ]
  },
  {
    name: 'tasks',
    displayName: '任务',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'status', type: 'status', required: false },
      { name: 'category', type: 'text', required: false },
      { name: 'tag', type: 'text', required: false },
      { name: 'createdByUserId', type: 'number', required: true },
      { name: 'assignedToUserId', type: 'number', required: false }
    ]
  },
  {
    name: 'k8s_clusters',
    displayName: 'K8s集群',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'endpoint', type: 'text', required: true },
      { name: 'token', type: 'text', required: false }
    ]
  },
  {
    name: 'k8s_nodes',
    displayName: 'K8s节点',
    fields: [
      { name: 'clusterId', type: 'number', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'status', type: 'text', required: false }
    ]
  }
])

const selectedTable = ref('users')
const tableData = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// 模态框状态
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingRow = ref<any>(null)
const deletingRow = ref<any>(null)

// 表单数据
const formData = ref<any>({})

// 获取表格数据
async function fetchTableData(tableName: string) {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ success: boolean; data?: any[]; error?: string }>(`/api/admin/database/${tableName}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e: any) => {
      return { success: false, error: e.message || '获取数据失败' } as const
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '获取数据失败')
    }

    tableData.value = response.data || []
  } catch (e: any) {
    error.value = e.message || '获取数据失败'
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 切换表格
async function selectTable(tableName: string) {
  selectedTable.value = tableName
  await fetchTableData(tableName)
}

// 格式化值
function formatValue(value: any): string {
  if (value === null) return 'NULL'
  if (value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 打开创建模态框
function openCreateModal() {
  formData.value = {}
  showCreateModal.value = true
}

// 打开编辑模态框
function openEditModal(row: any) {
  editingRow.value = row
  formData.value = { ...row }
  showEditModal.value = true
}

// 打开删除确认框
function openDeleteModal(row: any) {
  deletingRow.value = row
  showDeleteModal.value = true
}

// 创建记录
async function createRecord() {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; error?: string }>(`/api/admin/database/${selectedTable.value}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: formData.value
    }).catch((e: any) => {
      return { success: false, error: e.message || '创建失败' }
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '创建失败')
    }

    showCreateModal.value = false
    await fetchTableData(selectedTable.value)
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    loading.value = false
  }
}

// 更新记录
async function updateRecord() {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; error?: string }>(`/api/admin/database/${selectedTable.value}/${editingRow.value.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      body: formData.value
    }).catch((e: any) => {
      return { success: false, error: e.message || '更新失败' }
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '更新失败')
    }

    showEditModal.value = false
    editingRow.value = null
    await fetchTableData(selectedTable.value)
  } catch (e: any) {
    alert(e.message || '更新失败')
  } finally {
    loading.value = false
  }
}

// 删除记录
async function deleteRecord() {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; error?: string }>(`/api/admin/database/${selectedTable.value}/${deletingRow.value.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e: any) => {
      return { success: false, error: e.message || '删除失败' }
    })

    if (!response.success || response.error) {
      throw new Error(response.error || '删除失败')
    }

    showDeleteModal.value = false
    deletingRow.value = null
    await fetchTableData(selectedTable.value)
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 获取所有可编辑的字段及其类型
const editableFields = computed(() => {
  // 优先使用预定义的字段
  const tableConfig = tables.value.find(t => t.name === selectedTable.value)
  if (tableConfig && tableConfig.fields) {
    return tableConfig.fields
  }

  // 如果没有预定义，尝试从数据推断（用于编辑已存在的记录）
  if (tableData.value.length === 0 || !tableData.value[0]) return []
  const row = tableData.value[0]
  const readonlyFields = ['id', 'createdAt', 'deletedAt', 'updatedAt']

  return Object.keys(row)
    .filter(col => !readonlyFields.includes(col))
    .map(col => {
      const value = row[col]
      let fieldType = 'text'

      if (typeof value === 'number') fieldType = 'number'
      else if (col.includes('password')) fieldType = 'password'
      else if (col.includes('email')) fieldType = 'email'
      else if (col.includes('role')) fieldType = 'role'
      else if (col.includes('status')) fieldType = 'status'

      return { name: col, type: fieldType }
    })
})

// 获取表头（用于显示）
const columns = computed(() => {
  if (tableData.value.length === 0 || !tableData.value[0]) return []
  return Object.keys(tableData.value[0])
})

// 初始加载
onMounted(() => {
  fetchTableData(selectedTable.value)
})
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            应用管理
          </h2>
        </div>
      </div>

      <!-- Tables List -->
      <div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">数据库表</h3>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              v-for="table in tables"
              :key="table.name"
              @click="selectTable(table.name)"
              :class="[
                'relative block p-4 border rounded-lg text-left transition',
                selectedTable === table.name
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-base font-semibold" :class="selectedTable === table.name ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'">
                    {{ table.displayName }}
                  </h4>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ table.name }}</p>
                </div>
                <svg v-if="selectedTable === table.name" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Data -->
      <div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {{ tables.find(t => t.name === selectedTable)?.displayName }} 数据
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">({{ tableData.length }} 条记录)</span>
            </h3>
            <div class="flex gap-2">
              <button
                @click="openCreateModal"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                新增
              </button>
              <button
                @click="fetchTableData(selectedTable)"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading && tableData.length === 0" class="text-center py-12">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-400">加载失败</h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-else-if="tableData.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="mt-2 text-gray-500 dark:text-gray-400">暂无数据</p>
          </div>

          <!-- Data Table -->
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    v-for="column in columns"
                    :key="column"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {{ column }}
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(row, index) in tableData" :key="index">
                  <td
                    v-for="column in columns"
                    :key="column"
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    <span class="block max-w-xs truncate" :title="formatValue(row[column])">
                      {{ formatValue(row[column]) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="openEditModal(row)"
                      class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      @click="openDeleteModal(row)"
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">新增记录</h3>
            <div class="space-y-4">
              <div v-for="field in editableFields" :key="field.name" class="flex flex-col">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.name }}</label>
                <select v-if="field.type === 'role'" v-model="formData[field.name]" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">请选择</option>
                  <option value="admin">管理员</option>
                  <option value="employee">员工</option>
                </select>
                <input v-else-if="field.type === 'status'" v-model="formData[field.name]" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="todo, in_progress, in_review, done, cancelled">
                <input v-else v-model="formData[field.name]" :type="field.type" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="createRecord" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
              创建
            </button>
            <button @click="showCreateModal = false" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showEditModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">编辑记录</h3>
            <div class="space-y-4">
              <div v-for="field in editableFields" :key="field.name" class="flex flex-col">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.name }}</label>
                <select v-if="field.type === 'role'" v-model="formData[field.name]" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">请选择</option>
                  <option value="admin">管理员</option>
                  <option value="employee">员工</option>
                </select>
                <input v-else-if="field.type === 'status'" v-model="formData[field.name]" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="todo, in_progress, in_review, done, cancelled">
                <input v-else v-model="formData[field.name]" :type="field.type" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="updateRecord" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
              保存
            </button>
            <button @click="showEditModal = false; editingRow = null" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showDeleteModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">确认删除</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">确定要删除这条记录吗？此操作无法撤销。</p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="deleteRecord" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
              删除
            </button>
            <button @click="showDeleteModal = false; deletingRow = null" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
