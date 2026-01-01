<script setup lang="ts">
import type { FormField } from '~~/types'

interface Props {
  fields: FormField[]
  modelValue: Record<string, any>
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'submit'): void
}>()

const localData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function getFieldClass() {
  const baseClass = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'

  if (props.disabled || props.loading) {
    return `${baseClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60`
  }

  return baseClass
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">任务完成表单</h3>

    <form @submit.prevent="emit('submit')">
      <div class="space-y-4">
        <!-- Text Input -->
        <div v-for="field in fields" :key="field.name">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>

          <!-- Text input -->
          <input
            v-if="field.type === 'text'"
            v-model="localData[field.name]"
            :type="field.type"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="disabled || loading"
            :class="getFieldClass()"
          />

          <!-- Number input -->
          <input
            v-else-if="field.type === 'number'"
            v-model.number="localData[field.name]"
            type="number"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="disabled || loading"
            :class="getFieldClass()"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="localData[field.name]"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="disabled || loading"
            rows="4"
            :class="getFieldClass()"
          />

          <!-- Select -->
          <select
            v-else-if="field.type === 'select'"
            v-model="localData[field.name]"
            :required="field.required"
            :disabled="disabled || loading"
            :class="getFieldClass()"
          >
            <option value="" disabled>{{ field.placeholder || '请选择' }}</option>
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <!-- Boolean/Checkbox -->
          <div v-else-if="field.type === 'boolean'" class="flex items-center">
            <input
              v-model="localData[field.name]"
              type="checkbox"
              :disabled="disabled || loading"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              :class="{ 'opacity-50 cursor-not-allowed': disabled || loading }"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ field.label }}</span>
          </div>

          <!-- Date input -->
          <input
            v-else-if="field.type === 'date'"
            v-model="localData[field.name]"
            type="date"
            :required="field.required"
            :disabled="disabled || loading"
            :class="getFieldClass()"
          />
        </div>
      </div>

      <!-- Submit button -->
      <div class="mt-6">
        <button
          type="submit"
          :disabled="disabled || loading"
          class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="loading"
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
          {{ loading ? '提交中...' : '提交任务' }}
        </button>
      </div>
    </form>
  </div>
</template>
