<template>
  <div class="space-y-6">
    

    <!-- Alert Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div :class="[
        'card cursor-pointer transition-all hover:shadow-lg',
        filter === 'high' ? 'bg-red-100 border-4 border-red-400 shadow-lg' : 'bg-red-50 border-2 border-red-200'
      ]" @click="filter = 'high'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-red-700 font-medium">Cảnh Báo Cao</p>
            <p class="text-3xl font-bold text-red-700">{{ highAlerts }}</p>
          </div>
          <svg class="w-12 h-12 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      <div :class="[
        'card cursor-pointer transition-all hover:shadow-lg',
        filter === 'medium' ? 'bg-orange-100 border-4 border-orange-400 shadow-lg' : 'bg-orange-50 border-2 border-orange-200'
      ]" @click="filter = 'medium'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-orange-700 font-medium">Cảnh Báo Trung Bình</p>
            <p class="text-3xl font-bold text-orange-700">{{ mediumAlerts }}</p>
          </div>
          <svg class="w-12 h-12 text-orange-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div :class="[
        'card cursor-pointer transition-all hover:shadow-lg',
        filter === 'low' ? 'bg-yellow-100 border-4 border-yellow-400 shadow-lg' : 'bg-yellow-50 border-2 border-yellow-200'
      ]" @click="filter = 'low'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-yellow-700 font-medium">Cảnh Báo Thấp</p>
            <p class="text-3xl font-bold text-yellow-700">{{ lowAlerts }}</p>
          </div>
          <svg class="w-12 h-12 text-yellow-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div :class="[
        'card cursor-pointer transition-all hover:shadow-lg',
        filter === 'resolved' ? 'bg-green-100 border-4 border-green-400 shadow-lg' : 'bg-green-50 border-2 border-green-200'
      ]" @click="filter = 'resolved'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-700 font-medium">Đã Xử Lý</p>
            <p class="text-3xl font-bold text-green-700">{{ resolvedAlerts }}</p>
          </div>
          <svg class="w-12 h-12 text-green-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Alerts List -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Danh Sách Cảnh Báo</h3>
        <button v-if="highAlerts + mediumAlerts + lowAlerts > 0" @click="markAllAsRead"
          class="text-sm text-primary hover:text-primary/80 font-medium">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-600">Đang tải...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAlerts.length === 0" class="text-center py-12">
        <p class="text-gray-600">Không có cảnh báo nào</p>
      </div>

      <!-- Alerts List -->
      <div v-else class="space-y-3">
        <div v-for="alert in filteredAlerts" :key="alert.id" :class="[
          'p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all',
          getAlertBg(alert)
        ]" @click="markAsRead(alert.id)">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <component :is="getAlertIcon(alert.type)" class="w-5 h-5" />
                <h4 class="font-semibold text-gray-800">{{ alert.title }}</h4>
                <span :class="getBadgeClass(alert.severity)">
                  {{ getSeverityText(alert.severity) }}
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ alert.message }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ formatDateTime(new Date(alert.date)) }}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
              <button v-if="!alert.read" class="text-primary hover:text-primary/80 transition-colors"
                @click.stop="markAsRead(alert.id)" title="Đánh dấu đã đọc">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button @click.stop="deleteAlert(alert.id)" class="text-red-600 hover:text-red-700 transition-colors"
                title="Xóa">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <span v-if="!alert.read" class="w-2 h-2 bg-primary rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BellAlertIcon, ExclamationTriangleIcon, CubeIcon, CogIcon } from '@heroicons/vue/24/outline'
import type { Alert } from '@/types'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

const filter = ref<'all' | 'high' | 'medium' | 'low' | 'resolved'>('all')
const alerts = ref<Alert[]>([])
const loading = ref(false)

const filteredAlerts = computed(() => {
  if (filter.value === 'all') return alerts.value
  if (filter.value === 'high') return alerts.value.filter(a => a.severity === 'high' && !a.read)
  if (filter.value === 'medium') return alerts.value.filter(a => a.severity === 'medium' && !a.read)
  if (filter.value === 'low') return alerts.value.filter(a => a.severity === 'low' && !a.read)
  if (filter.value === 'resolved') return alerts.value.filter(a => a.read)
  return alerts.value
})

const highAlerts = computed(() => alerts.value.filter(a => a.severity === 'high' && !a.read).length)
const mediumAlerts = computed(() => alerts.value.filter(a => a.severity === 'medium' && !a.read).length)
const lowAlerts = computed(() => alerts.value.filter(a => a.severity === 'low' && !a.read).length)
const resolvedAlerts = computed(() => alerts.value.filter(a => a.read).length)

async function fetchAlerts() {
  loading.value = true
  try {
    const params: any = { page: 1, limit: 100 }
    const response = await api.get('/alerts', { params })
    alerts.value = response.data.data.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      severity: item.severity,
      date: item.date || item.created_at || new Date().toISOString(),
      read: item.read || false
    }))
  } catch (err) {
    console.error('Error fetching alerts:', err)
    alerts.value = []
  } finally {
    loading.value = false
  }
}

async function markAsRead(alertId: string) {
  try {
    await api.put(`/alerts/${alertId}/read`)
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) alert.read = true
    success('Đã đánh dấu đã đọc')
    // Refresh data after marking as read
    await fetchAlerts()
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi cập nhật cảnh báo')
  }
}

async function deleteAlert(alertId: string) {
  if (confirm('Bạn có chắc chắn muốn xóa cảnh báo này?')) {
    try {
      await api.delete(`/alerts/${alertId}`)
      alerts.value = alerts.value.filter(a => a.id !== alertId)
      success('Đã xóa cảnh báo')
    } catch (err: any) {
      error(err.response?.data?.error || 'Lỗi khi xóa cảnh báo')
    }
  }
}

onMounted(() => {
  fetchAlerts()
})

async function markAllAsRead() {
  const unread = alerts.value.filter(a => !a.read)
  try {
    await Promise.all(unread.map(a => api.put(`/alerts/${a.id}/read`)))
    alerts.value.forEach(a => { a.read = true })
    success('Đã đánh dấu tất cả là đã đọc')
    // Refresh data after marking all as read
    await fetchAlerts()
  } catch (err) {
    error('Lỗi khi cập nhật cảnh báo')
    console.error(err)
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'expiry':
      return ExclamationTriangleIcon
    case 'low_stock':
      return CubeIcon
    case 'system':
      return CogIcon
    default:
      return BellAlertIcon
  }
}

function getAlertBg(alert: Alert): string {
  // Nếu đã xử lý thì dùng màu xanh
  if (alert.read) {
    return 'bg-green-50 border-green-400'
  }
  // Nếu chưa xử lý thì dùng màu theo severity
  switch (alert.severity) {
    case 'high':
      return 'bg-red-50 border-red-400'
    case 'medium':
      return 'bg-orange-50 border-orange-400'
    case 'low':
      return 'bg-yellow-50 border-yellow-400'
    default:
      return 'bg-gray-50 border-gray-400'
  }
}

function getBadgeClass(severity: string): string {
  switch (severity) {
    case 'high':
      return 'px-3 py-1 bg-red-600 text-white rounded-full text-xs'
    case 'medium':
      return 'px-3 py-1 bg-orange-600 text-white rounded-full text-xs'
    case 'low':
      return 'px-3 py-1 bg-yellow-600 text-white rounded-full text-xs'
    default:
      return 'px-3 py-1 bg-gray-600 text-white rounded-full text-xs'
  }
}

function getSeverityText(severity: string): string {
  switch (severity) {
    case 'high':
      return 'Cao'
    case 'medium':
      return 'Trung bình'
    case 'low':
      return 'Thấp'
    default:
      return ''
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('vi-VN')
}

</script>
