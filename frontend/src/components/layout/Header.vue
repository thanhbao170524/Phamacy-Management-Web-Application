<template>
  <header class="bg-white shadow-md h-20 px-6 flex items-center justify-between">
    <h2 class="text-xl font-semibold text-gray-800">{{ pageTitle }}</h2>

    <div class="flex items-center gap-4">
      <!-- Chat Icon -->
      <button class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
        @click="showChat = !showChat">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span v-if="hasUnreadMessages" class="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
      </button>

      <!-- Notifications -->
      <div class="relative">
        <button class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          @click="showNotifications = !showNotifications">
          <BellAlertIcon class="w-6 h-6" />
          <span v-if="unreadNotificationsCount > 0"
            class="absolute bottom-5 left-5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <NotificationsDropdown :is-open="showNotifications" @close="showNotifications = false"
          @view-all="handleViewAllNotifications" ref="notificationsRef" />
      </div>

      <!-- User Menu -->
      <div class="flex items-center gap-3 pl-4 border-l border-gray-300">
        <img :src="user?.avatar" :alt="user?.name" class="w-10 h-10 rounded-full" />
        <div>
          <p class="text-sm font-medium text-gray-800">{{ user?.name }}</p>
          <p class="text-xs text-gray-500">{{ roleLabel }}</p>
        </div>
        <button @click="logout" class="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Chat Modal (using Teleport) -->
    <Teleport to="body">
      <ChatModal v-if="showChat" @close="showChat = false" />
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { Teleport } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types'
import { BellAlertIcon } from '@heroicons/vue/24/outline'
import ChatModal from '@/components/ChatModal.vue'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showChat = ref(false)
const showNotifications = ref(false)
const hasUnreadMessages = ref(false)
const unreadNotificationsCount = ref(0)
const notificationsRef = ref<InstanceType<typeof NotificationsDropdown> | null>(null)

// Fetch unread notifications count
async function fetchUnreadNotificationsCount() {
  try {
    const response = await api.get('/notifications/unread/count')
    unreadNotificationsCount.value = response.data.count || 0
  } catch (error) {
    console.error('Error fetching unread notifications count:', error)
  }
}

function handleViewAllNotifications() {
  router.push('/alerts')
  showNotifications.value = false
}

onMounted(() => {
  fetchUnreadNotificationsCount()
  // Refresh every 5 seconds for faster updates
  const interval = setInterval(() => {
    fetchUnreadNotificationsCount()
    // Also refresh the dropdown if it's open
    if (notificationsRef.value) {
      notificationsRef.value.refreshUnreadCount()
    }
  }, 500)

  // Cleanup on unmount
  return () => clearInterval(interval)
})

// Refresh when route changes or when user returns to page
watch(() => route.path, () => {
  fetchUnreadNotificationsCount()
})

// Refresh when page becomes visible (user switches tabs back)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      fetchUnreadNotificationsCount()
      if (notificationsRef.value) {
        notificationsRef.value.refreshUnreadCount()
      }
    }
  })
}

const user = computed(() => authStore.user)

const roleLabel = computed(() => {
  const role = user.value?.role
  switch (role) {
    case UserRole.ADMIN:
      return 'Chủ tiệm thuốc'
    case UserRole.SALES_STAFF:
      return 'Nhân viên bán hàng'
    case UserRole.INVENTORY_STAFF:
      return 'Nhân viên quản lý kho'
    default:
      return ''
  }
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    Dashboard: 'Trang Chủ',
    Medicines: 'Quản Lý Thuốc',
    Categories: 'Quản Lý Danh Mục',
    Inventory: 'Quản Lý Kho',
    Sales: 'Bán Hàng',
    Alerts: 'Cảnh Báo',
    Reports: 'Báo Cáo',
    Staff: 'Quản Lý Nhân Viên',
    Members: 'Quản Lý Thành Viên',
    Settings: 'Cài Đặt'
  }
  return titles[route.name as string] || 'PharmaT'
})

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
