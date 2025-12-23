<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'

const userStore = useUserStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const newUserForm = ref({
	email: '',
	password: '',
	role: 'employee' as 'admin' | 'employee'
})

// 当前用户 ID（用于禁用操作）
const currentUserId = computed(() => authStore.user?.id)

onMounted(async () => {
	await userStore.fetchUsers()
})

// 创建用户
async function handleCreateUser() {
	if (!newUserForm.value.email || !newUserForm.value.password) return

	try {
		await userStore.createUser({
			email: newUserForm.value.email,
			password: newUserForm.value.password,
			role: newUserForm.value.role
		})

		showCreateModal.value = false
		newUserForm.value = {
			email: '',
			password: '',
			role: 'employee'
		}
	} catch (error: any) {
		alert(error.message || '创建用户失败')
	}
}

// 切换角色
async function handleToggleRole(user: any) {
	if (user.id === currentUserId.value) {
		alert('不能修改自己的角色')
		return
	}

	const newRole = user.role === 'admin' ? 'employee' : 'admin'
	const confirmed = confirm(`确定要将 ${user.email} 的角色更改为 ${newRole === 'admin' ? '管理员' : '员工'} 吗？`)

	if (confirmed) {
		try {
			await userStore.updateUserRole(user.id, newRole)
		} catch (error: any) {
			alert(error.message || '更新角色失败')
		}
	}
}

// 删除用户
async function handleDeleteUser(user: any) {
	if (user.id === currentUserId.value) {
		alert('不能删除自己')
		return
	}

	const confirmed = confirm(`确定要删除用户 ${user.email} 吗？`)
	if (confirmed) {
		try {
			await userStore.deleteUser(user.id)
		} catch (error: any) {
			alert(error.message || '删除用户失败')
		}
	}
}
</script>

<template>
	<div>
		<!-- 标题和操作栏 -->
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-gray-800">用户管理</h1>
			<button
				@click="showCreateModal = true"
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				+ 创建用户
			</button>
		</div>

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
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							操作
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					<tr v-if="userStore.users.length === 0">
						<td colspan="5" class="px-6 py-4 text-center text-gray-500">暂无用户</td>
					</tr>
					<tr v-for="user in userStore.users" :key="user.id" class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{{ user.id }}
							<span v-if="user.id === currentUserId" class="ml-2 text-xs text-gray-400">(当前)</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{{ user.email }}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs rounded cursor-pointer hover:opacity-80"
								:class="
									user.role === 'admin'
										? 'bg-blue-100 text-blue-800'
										: 'bg-green-100 text-green-800'
								"
								@click="handleToggleRole(user)"
								title="点击切换角色"
							>
								{{ user.role === 'admin' ? '管理员' : '员工' }}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{{ user.createdAt }}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm">
							<button
								v-if="user.id !== currentUserId"
								@click="handleDeleteUser(user)"
								class="text-red-600 hover:text-red-900"
							>
								删除
							</button>
							<span v-else class="text-gray-400">-</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- 创建用户弹窗 -->
		<div
			v-if="showCreateModal"
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				<div class="flex items-center justify-between p-6 border-b">
					<h2 class="text-xl font-bold">创建用户</h2>
					<button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>

				<form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
						<input
							v-model="newUserForm.email"
							type="email"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
						<input
							v-model="newUserForm.password"
							type="password"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
						<select
							v-model="newUserForm.role"
							class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="employee">员工</option>
							<option value="admin">管理员</option>
						</select>
					</div>

					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							@click="showCreateModal = false"
							class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
						>
							取消
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							创建
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
