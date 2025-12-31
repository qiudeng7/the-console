<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'

definePageMeta({
  layout: 'admin',
  requiresAdmin: true
})

const authStore = useAuthStore()

// 表格列表
const tables = ref([
  { name: 'users', displayName: '用户', count: 0 },
  { name: 'tasks', displayName: '任务', count: 0 },
  { name: 'k8s_clusters', displayName: 'K8s集群', count: 0 },
  { name: 'k8s_nodes', displayName: 'K8s节点', count: 0 }
])

const selectedTable = ref('users')
const tableData = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// 获取表格数据
async function fetchTableData(tableName: string) {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<any[]>(`/api/admin/database/${tableName}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }).catch((e: any) => {
      return { error: e.message || '获取数据失败' }
    })

    if ('error' in response) {
      throw new Error(response.error)
    }

    tableData.value = response
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

// 获取表头
function getColumns() {
  if (tableData.value.length === 0) return []
  return Object.keys(tableData.value[0])
}

// 格式化值
function formatValue(value: any): string {
  if (value === null) return 'NULL'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

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
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            应用管理
          </h2>
        </div>
      </div>

      <!-- Tables List -->
      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">数据库表</h3>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              v-for="table in tables"
              :key="table.name"
              @click="selectTable(table.name)"
              :class="[
                'relative block p-4 border rounded-lg text-left transition',
                selectedTable === table.name
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:bg-gray-50'
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-base font-semibold" :class="selectedTable === table.name ? 'text-indigo-900' : 'text-gray-900'">
                    {{ table.displayName }}
                  </h4>
                  <p class="mt-1 text-sm text-gray-500">{{ table.name }}</p>
                </div>
                <svg v-if="selectedTable === table.name" class="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Data -->
      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {{ tables.find(t => t.name === selectedTable)?.displayName }} 数据
              <span class="ml-2 text-sm text-gray-500">({{ tableData.length }} 条记录)</span>
            </h3>
            <button
              @click="fetchTableData(selectedTable)"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="text-center py-12">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-2 text-gray-500">加载中...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">加载失败</h3>
                <div class="mt-2 text-sm text-red-700">
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
            <p class="mt-2 text-gray-500">暂无数据</p>
          </div>

          <!-- Data Table -->
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    v-for="column in getColumns()"
                    :key="column"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in tableData" :key="index">
                  <td
                    v-for="column in getColumns()"
                    :key="column"
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    <span class="block max-w-xs truncate" :title="formatValue(row[column])">
                      {{ formatValue(row[column]) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
