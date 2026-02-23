<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-primary px-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-title font-bold text-primary tracking-tight">PharmaT</h1>
        <p class="text-gray-600">Hệ Thống Quản Lý Nhà Thuốc</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input v-model="email" type="email" required class="input-field" placeholder="Nhập email của bạn" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
          <input ref="passwordInput" v-model="password" type="password" required class="input-field"
            placeholder="Nhập mật khẩu của bạn" autocomplete="current-password" inputmode="latin" />
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center">
            <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary" />
            <span class="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
          </label>
          <a href="#" class="text-sm text-primary hover:underline">Quên mật khẩu?</a>
        </div>

        <Transition name="fade">
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-red-600 font-medium flex-1">{{ errorMessage }}</p>
            </div>
          </div>
        </Transition>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng Nhập' }}
        </button>
      </form>

      <!-- Demo Credentials -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <p class="text-xs text-gray-600 mb-2">Thông tin tài khoản demo:</p>
        <div class="space-y-1 text-xs">
          <p><strong>Admin:</strong> admin@pharmat.com / password</p>
          <p><strong>Sales:</strong> sales@pharmat.com / password</p>
          <p><strong>Inventory:</strong> inventory@pharmat.com / password</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

const errorMessage = ref('')

// Tắt IME cho ô nhập mật khẩu
onMounted(() => {
  if (passwordInput.value) {
    passwordInput.value.setAttribute('lang', 'en')
      ; (passwordInput.value.style as any).imeMode = 'disabled'
  }
})

// Xóa thông báo lỗi khi user thay đổi email hoặc password
watch([email, password], () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})

async function handleLogin() {
  loading.value = true
  errorMessage.value = '' // Ẩn thông báo lỗi khi bắt đầu đăng nhập lại

  try {
    const result = await authStore.login(email.value, password.value)
    if (result.success) {
      // Đăng nhập thành công - đảm bảo xóa thông báo lỗi
      errorMessage.value = ''
      router.push('/')
    } else {
      errorMessage.value = result.error || 'Đăng nhập thất bại'
      // Thông báo lỗi sẽ hiển thị đến khi user nhấn đăng nhập lại hoặc thay đổi input
    }
  } catch (error: any) {
    console.error('Login failed:', error)
    // Kiểm tra nếu là lỗi kết nối database
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.response?.status === 500) {
      errorMessage.value = 'Không thể kết nối đến server. Vui lòng kiểm tra MySQL đã được khởi động.'
    } else {
      errorMessage.value = error.response?.data?.error || 'Đã có lỗi xảy ra'
    }
    // Thông báo lỗi sẽ hiển thị đến khi user nhấn đăng nhập lại hoặc thay đổi input
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Font riêng cho chữ PharmaT ở trang đăng nhập */
.login-logo {
  font-family: 'Cal Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-feature-settings: 'liga' 1, 'calt' 1;
}

/* Tắt IME (bộ gõ tiếng Việt) cho ô mật khẩu */
input[type="password"] {
  ime-mode: disabled !important;
  -ms-ime-mode: disabled !important;
  -webkit-ime-mode: disabled !important;
  -moz-ime-mode: disabled !important;
}
</style>
