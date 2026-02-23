<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-title text-gray-800"></h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Navigation -->
      <div class="lg:col-span-1">
        <div class="card sticky top-6">
          <nav class="space-y-2">
            <button
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              :class="[
                'w-full text-left px-4 py-3 rounded-lg transition-all',
                activeSection === section.id
                  ? 'bg-primary text-white shadow-md'
                  : 'hover:bg-gray-100'
              ]"
            >
              <div class="flex items-center gap-3">
                <component :is="section.icon" class="w-5 h-5" />
                <span>{{ section.label }}</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="lg:col-span-2">
        <!-- General Settings -->
        <div v-if="activeSection === 'general'" class="card">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Cài Đặt Chung</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tên Nhà Thuốc</label>
              <input
                v-model="settings.pharmacy_name"
                type="text"
                class="input-field"
                placeholder="Nhập tên nhà thuốc"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Địa Chỉ</label>
              <textarea
                v-model="settings.pharmacy_address"
                class="input-field"
                rows="3"
                placeholder="Nhập địa chỉ nhà thuốc"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Số Điện Thoại</label>
                <input
                  v-model="settings.pharmacy_phone"
                  type="tel"
                  class="input-field"
                  placeholder="0901234567"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  v-model="settings.pharmacy_email"
                  type="email"
                  class="input-field"
                  placeholder="info@pharmat.com"
                />
              </div>
            </div>
            <button @click="saveSettings" :disabled="saving" class="btn-primary">
              {{ saving ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
            </button>
          </div>
        </div>

        <!-- Security Settings -->
        <div v-if="activeSection === 'security'" class="card">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Bảo Mật</h2>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mật Khẩu Hiện Tại</label>
              <input
                v-model="password.current"
                type="password"
                class="input-field"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mật Khẩu Mới</label>
              <input
                v-model="password.new"
                type="password"
                class="input-field"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Xác Nhận Mật Khẩu Mới</label>
              <input
                v-model="password.confirm"
                type="password"
                class="input-field"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
            <div class="flex items-center gap-4">
              <label class="flex items-center">
                <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="ml-2 text-sm text-gray-600">Yêu cầu đổi mật khẩu mỗi 90 ngày</span>
              </label>
            </div>
            <button @click="changePassword" :disabled="changingPassword" class="btn-primary">
              {{ changingPassword ? 'Đang xử lý...' : 'Đổi Mật Khẩu' }}
            </button>
          </div>
        </div>

        <!-- Notification Settings -->
        <div v-if="activeSection === 'notifications'" class="card">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Thông Báo</h2>
          <div class="space-y-6">
            <div v-for="item in notificationSettings" :key="item.id" class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-800">{{ item.label }}</p>
                <p class="text-sm text-gray-600">{{ item.description }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="item.enabled"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <button @click="saveNotificationSettings" :disabled="savingNotifications" class="btn-primary">
              {{ savingNotifications ? 'Đang lưu...' : 'Lưu Cài Đặt' }}
            </button>
          </div>
        </div>

        <!-- Backup Settings -->
        <div v-if="activeSection === 'backup'" class="card">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Sao Lưu & Khôi Phục</h2>
          <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="font-medium text-gray-800 mb-2">Sao lưu dữ liệu</p>
              <p class="text-sm text-gray-600 mb-4">Sao lưu tất cả dữ liệu hệ thống để bảo vệ khỏi mất mát.</p>
              <button @click="exportBackup" :disabled="exportingBackup" class="btn-outline">
                {{ exportingBackup ? 'Đang xuất...' : 'Xuất Dữ Liệu' }}
              </button>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="font-medium text-gray-800 mb-2">Khôi phục dữ liệu</p>
              <p class="text-sm text-gray-600 mb-4">Khôi phục dữ liệu từ file sao lưu.</p>
              <input
                ref="fileInputRef"
                type="file"
                accept=".json"
                @change="handleFileSelect"
                class="hidden"
              />
              <button @click="triggerFileInput" :disabled="importingBackup" class="btn-outline">
                {{ importingBackup ? 'Đang nhập...' : 'Nhập Dữ Liệu' }}
              </button>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="font-medium text-yellow-800">Cảnh báo</p>
                  <p class="text-sm text-yellow-700">Việc khôi phục sẽ ghi đè dữ liệu hiện tại. Hãy sao lưu dữ liệu trước khi khôi phục.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { CogIcon, ShieldCheckIcon, BellAlertIcon, ServerIcon } from '@heroicons/vue/24/outline'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

const activeSection = ref('general')
const saving = ref(false)
const changingPassword = ref(false)
const savingNotifications = ref(false)
const exportingBackup = ref(false)
const importingBackup = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const sections = [
  { id: 'general', label: 'Cài Đặt Chung', icon: CogIcon },
  { id: 'security', label: 'Bảo Mật', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Thông Báo', icon: BellAlertIcon },
  { id: 'backup', label: 'Sao Lưu & Khôi Phục', icon: ServerIcon }
]

const settings = reactive({
  pharmacy_name: '',
  pharmacy_address: '',
  pharmacy_phone: '',
  pharmacy_email: ''
})

async function fetchSettings() {
  try {
    const response = await api.get('/settings')
    const data = response.data
    settings.pharmacy_name = data.pharmacy_name || ''
    settings.pharmacy_address = data.pharmacy_address || ''
    settings.pharmacy_phone = data.pharmacy_phone || ''
    settings.pharmacy_email = data.pharmacy_email || ''
  } catch (err) {
    console.error('Error fetching settings:', err)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    // Update each setting individually
    const updates = [
      { key: 'pharmacy_name', value: settings.pharmacy_name },
      { key: 'pharmacy_address', value: settings.pharmacy_address },
      { key: 'pharmacy_phone', value: settings.pharmacy_phone },
      { key: 'pharmacy_email', value: settings.pharmacy_email }
    ]
    
    await Promise.all(
      updates.map(setting => 
        api.put(`/settings/${setting.key}`, { value: setting.value })
      )
    )
    
    success('Đã lưu cài đặt thành công!')
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi lưu cài đặt')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})

const password = reactive({
  current: '',
  new: '',
  confirm: ''
})

const notificationSettings = reactive([
  {
    id: 'expiry',
    label: 'Cảnh báo thuốc hết hạn',
    description: 'Nhận thông báo khi có thuốc sắp hết hạn',
    enabled: true
  },
  {
    id: 'low_stock',
    label: 'Cảnh báo hết hàng',
    description: 'Nhận thông báo khi hàng hóa sắp hết',
    enabled: true
  },
  {
    id: 'new_order',
    label: 'Thông báo đơn hàng mới',
    description: 'Nhận thông báo khi có đơn hàng mới',
    enabled: false
  },
  {
    id: 'weekly_report',
    label: 'Email báo cáo hàng tuần',
    description: 'Nhận email báo cáo định kỳ',
    enabled: true
  }
])

async function fetchNotificationSettings() {
  try {
    const response = await api.get('/settings/notifications')
    const settings = response.data
    notificationSettings.forEach(setting => {
      if (settings[setting.id] !== undefined) {
        setting.enabled = settings[setting.id]
      }
    })
  } catch (err) {
    console.error('Error fetching notification settings:', err)
  }
}

async function saveNotificationSettings() {
  savingNotifications.value = true
  try {
    const settings: Record<string, boolean> = {}
    notificationSettings.forEach(setting => {
      settings[setting.id] = setting.enabled
    })
    
    await api.put('/settings/notifications', settings)
    success('Đã lưu cài đặt thông báo thành công!')
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi lưu cài đặt thông báo')
  } finally {
    savingNotifications.value = false
  }
}

async function changePassword() {
  if (!password.current || !password.new || !password.confirm) {
    error('Vui lòng điền đầy đủ thông tin')
    return
  }

  if (password.new !== password.confirm) {
    error('Mật khẩu mới và xác nhận mật khẩu không khớp')
    return
  }

  if (password.new.length < 6) {
    error('Mật khẩu mới phải có ít nhất 6 ký tự')
    return
  }

  changingPassword.value = true
  try {
    await api.post('/auth/change-password', {
      currentPassword: password.current,
      newPassword: password.new
    })
    
    success('Đổi mật khẩu thành công!')
    password.current = ''
    password.new = ''
    password.confirm = ''
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi đổi mật khẩu')
  } finally {
    changingPassword.value = false
  }
}

async function exportBackup() {
  exportingBackup.value = true
  try {
    const response = await api.post('/settings/backup/export')
    const dataStr = JSON.stringify(response.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pharmat_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    success('Xuất dữ liệu thành công!')
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi xuất dữ liệu')
  } finally {
    exportingBackup.value = false
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  if (!file.name.endsWith('.json')) {
    error('Vui lòng chọn file JSON hợp lệ')
    return
  }

  importingBackup.value = true
  try {
    const text = await file.text()
    const backupData = JSON.parse(text)
    
    if (!backupData.data) {
      throw new Error('File không hợp lệ')
    }

    await api.post('/settings/backup/import', { data: backupData.data })
    
    success('Nhập dữ liệu thành công!')
    
    // Refresh settings
    await fetchSettings()
    await fetchNotificationSettings()
    
    // Clear file input
    if (target) {
      target.value = ''
    }
  } catch (err: any) {
    if (err.message && err.message.includes('JSON')) {
      error('File JSON không hợp lệ')
    } else {
      error(err.response?.data?.error || 'Lỗi khi nhập dữ liệu')
    }
  } finally {
    importingBackup.value = false
  }
}

onMounted(() => {
  fetchSettings()
  fetchNotificationSettings()
})
</script>

