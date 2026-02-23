<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50" @click.self="close">
      <div
        class="absolute right-6 top-24 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[600px] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Thông Báo</h3>
          <div class="flex items-center gap-2">
            <button v-if="unreadCount > 0" @click="markAllAsRead" class="text-sm text-primary hover:underline">
              Đánh dấu tất cả đã đọc
            </button>
            <button @click="close" class="text-gray-500 hover:text-gray-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center p-8 text-gray-500">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p class="text-sm">Không có thông báo nào</p>
        </div>

        <!-- Notifications List -->
        <div v-else class="flex-1 overflow-y-auto">
          <div v-for="notification in notifications" :key="notification.id" :class="[
            'p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
            !notification.is_read && 'bg-blue-50'
          ]" @click="markAsRead(notification.id)">
            <div class="flex items-start gap-3">
              <div :class="[
                'mt-1 flex-shrink-0 w-2 h-2 rounded-full',
                notification.is_read ? 'bg-gray-300' : (notification.type === 'alert' && notification.severity === 'high' ? 'bg-red-500' : notification.type === 'alert' && notification.severity === 'medium' ? 'bg-orange-500' : 'bg-primary')
              ]"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p :class="[
                    'font-medium text-sm',
                    notification.is_read ? 'text-gray-700' : 'text-gray-900'
                  ]">
                    {{ notification.title }}
                  </p>
                  <span v-if="notification.type === 'alert'" :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    notification.severity === 'high' ? 'bg-red-100 text-red-700' :
                    notification.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  ]">
                    {{ notification.severity === 'high' ? 'Cao' : notification.severity === 'medium' ? 'Trung bình' : 'Thấp' }}
                  </span>
                </div>
                <p v-if="notification.message" class="text-xs text-gray-600 mt-1 line-clamp-2">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 mt-2">
                  {{ formatDate(notification.created_at) }}
                </p>
              </div>
              <button @click.stop="deleteNotification(notification.id)"
                class="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="p-3 border-t border-gray-200 text-center">
          <button @click="$emit('view-all')" class="text-sm text-primary hover:underline">
            Xem tất cả
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Teleport } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'view-all': [];
}>();

const { success, error } = useToast();

const notifications = ref<Array<{
  id: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  type?: 'notification' | 'alert';
  alert_id?: string;
  severity?: 'low' | 'medium' | 'high';
}>>([]);
const loading = ref(false);
const unreadCount = ref(0);

async function fetchNotifications(silent = false) {
  // Only show loading on initial fetch or manual refresh
  if (!silent) {
    loading.value = true;
  }
  try {
    const response = await api.get('/notifications', {
      params: {
        page: 1,
        limit: 20,
      },
    });
    notifications.value = response.data.data;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    notifications.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchUnreadCount() {
  try {
    const response = await api.get('/notifications/unread/count');
    unreadCount.value = response.data.count || 0;
  } catch (err) {
    console.error('Error fetching unread count:', err);
  }
}

async function markAsRead(id: string) {
  try {
    await api.put(`/notifications/${id}/read`);
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.is_read = true;
    }
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi đánh dấu đã đọc');
  }
}

async function markAllAsRead() {
  try {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => {
      n.is_read = true;
    });
    unreadCount.value = 0;
    success('Đã đánh dấu tất cả thông báo là đã đọc');
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi đánh dấu đã đọc');
  }
}

async function deleteNotification(id: string) {
  try {
    await api.delete(`/notifications/${id}`);
    notifications.value = notifications.value.filter(n => n.id !== id);
    const deleted = notifications.value.find(n => n.id === id);
    if (deleted && !deleted.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi xóa thông báo');
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function close() {
  emit('close');
}

// Watch for dropdown open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchNotifications();
    fetchUnreadCount();
  }
});

// Auto refresh - slower to prevent flickering
let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchUnreadCount();
  // Single interval that adjusts based on open state
  refreshInterval = setInterval(() => {
    if (props.isOpen) {
      // Refresh less frequently when open to prevent flickering (10s)
      // Use silent mode to prevent loading spinner
      fetchNotifications(true);
      fetchUnreadCount();
    } else {
      // Refresh count only when closed (5s)
      fetchUnreadCount();
    }
  }, props.isOpen ? 10000 : 5000);
});

// Change interval when dropdown opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  // Longer interval when open to prevent flickering
  refreshInterval = setInterval(() => {
    if (props.isOpen) {
      // Use silent mode to prevent loading spinner on background refresh
      fetchNotifications(true);
      fetchUnreadCount();
    } else {
      fetchUnreadCount();
    }
  }, isOpen ? 10000 : 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Expose methods for parent component
defineExpose({
  refreshUnreadCount: fetchUnreadCount,
  unreadCount,
});
</script>
