<template>
  <aside class="w-64 bg-white shadow-lg flex flex-col">
    <!-- Logo -->
    <div class="h-20 flex items-center justify-center border-b border-gray-200">
      <h1 class="text-3xl font-title font-bold text-primary tracking-tight">PharmaT</h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      <router-link v-for="item in menuItems" :key="item.name" :to="item.path"
        :class="['sidebar-link', { 'sidebar-link-active': $route.name === item.name }]">
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
        <span v-if="item.name === 'Alerts' && unreadAlertsCount > 0"
          class="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ unreadAlertsCount > 9 ? '9+' : unreadAlertsCount }}
        </span>
      </router-link>
    </nav>

    <!-- Footer with Settings Info -->
    <div class="px-4 py-4 border-t border-gray-200 bg-gray-50 space-y-2">
      <div v-if="settings.pharmacy_name" class="text-xs font-semibold text-gray-800">
        {{ settings.pharmacy_name }}
      </div>
      <div v-if="settings.pharmacy_address" class="text-xs text-gray-600">
        {{ settings.pharmacy_address }}
      </div>
      <div v-if="settings.pharmacy_phone" class="text-xs text-gray-600">
        📞 {{ settings.pharmacy_phone }}
      </div>
      <div v-if="settings.pharmacy_email" class="text-xs text-gray-600">
        ✉ {{ settings.pharmacy_email }}
      </div>
      <div v-if="!settings.pharmacy_name && !settings.pharmacy_address && !settings.pharmacy_phone && !settings.pharmacy_email"
        class="text-xs text-gray-500 italic">
        Chưa có thông tin cài đặt
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types'
import api from '@/services/api'
import {
  HomeIcon,
  BeakerIcon,
  CubeIcon,
  ShoppingCartIcon,
  BellAlertIcon,
  ChartBarIcon,
  UserGroupIcon,
  UsersIcon,
  CogIcon,
  TagIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const unreadAlertsCount = ref(0)
const settings = ref({
  pharmacy_name: '',
  pharmacy_address: '',
  pharmacy_phone: '',
  pharmacy_email: ''
})

const allMenuItems = [
  { name: 'Dashboard', path: '/', label: 'Trang Chủ', icon: HomeIcon },
  { name: 'Medicines', path: '/medicines', label: 'Thuốc', icon: BeakerIcon },
  { name: 'Categories', path: '/categories', label: 'Danh Mục Thuốc', icon: TagIcon },
  { name: 'Inventory', path: '/inventory', label: 'Kho', icon: CubeIcon },
  { name: 'Sales', path: '/sales', label: 'Bán Hàng', icon: ShoppingCartIcon },
  { name: 'Alerts', path: '/alerts', label: 'Cảnh Báo', icon: BellAlertIcon },
  { name: 'Reports', path: '/reports', label: 'Báo Cáo', icon: ChartBarIcon },
  { name: 'Staff', path: '/staff', label: 'Nhân Viên', icon: UserGroupIcon },
  { name: 'Members', path: '/members', label: 'Thành Viên', icon: UsersIcon },
  { name: 'Settings', path: '/settings', label: 'Cài Đặt', icon: CogIcon }
]

const menuItems = computed(() => {
  if (!authStore.user) return []

  const role = authStore.user.role

  // Filter menu items based on role
  return allMenuItems.filter(item => {
    if (item.name === 'Dashboard' || item.name === 'Alerts') return true

    switch (role) {
      case UserRole.ADMIN:
        return true
      case UserRole.SALES_STAFF:
        return ['Sales', 'Members', 'Medicines'].includes(item.name)
      case UserRole.INVENTORY_STAFF:
        return ['Medicines', 'Categories', 'Inventory'].includes(item.name)
      default:
        return false
    }
  })
})

// Fetch unread alerts count
async function fetchUnreadAlertsCount() {
  try {
    const response = await api.get('/alerts/unread/count')
    unreadAlertsCount.value = response.data.count || 0
  } catch (error) {
    console.error('Error fetching unread alerts count:', error)
    unreadAlertsCount.value = 0
  }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

async function fetchSettings() {
  try {
    const response = await api.get('/settings')
    const data = response.data
    settings.value = {
      pharmacy_name: data.pharmacy_name || '',
      pharmacy_address: data.pharmacy_address || '',
      pharmacy_phone: data.pharmacy_phone || '',
      pharmacy_email: data.pharmacy_email || ''
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
  }
}

onMounted(() => {
  fetchUnreadAlertsCount()
  fetchSettings()
  // Refresh every 5 seconds for faster updates
  refreshInterval = setInterval(fetchUnreadAlertsCount, 500)
})

// Refresh when route changes (user navigates)
watch(() => route.name, () => {
  fetchUnreadAlertsCount()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
