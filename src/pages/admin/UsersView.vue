<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(async () => {
	await userStore.fetchUsers()
})
</script>

<template>
	<div>
		<h1 class="text-2xl font-bold text-gray-800 mb-6">用户管理</h1>

		<!-- 用户列表 -->
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							ID
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							邮箱
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							角色
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							注册时间
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					<tr v-if="userStore.users.length === 0">
						<td colspan="4" class="px-6 py-4 text-center text-gray-500">暂无用户</td>
					</tr>
					<tr v-for="user in userStore.users" :key="user.id" class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{{ user.id }}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{{ user.email }}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs rounded"
								:class="
									user.role === 'admin'
										? 'bg-blue-100 text-blue-800'
										: 'bg-green-100 text-green-800'
								"
							>
								{{ user.role === 'admin' ? '管理员' : '员工' }}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{{ user.createdAt }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- 提示信息 -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
			<p class="text-sm text-blue-800">
				<strong class="font-semibold">提示：</strong>
				角色切换和创建用户功能需要添加后端 API 支持。当前仅支持查看用户列表。
			</p>
		</div>
	</div>
</template>
