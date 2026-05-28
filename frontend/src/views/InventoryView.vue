<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-title text-gray-800"></h1>
      <div class="flex gap-3">
        <button @click="openInventoryModal('import')" class="btn-accent">
          <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Nhập Kho
        </button>
        <button @click="openInventoryModal('export')" class="btn-outline">
          <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Xuất Kho
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90">Tổng Giá Trị Kho</p>
            <p class="text-3xl font-bold">{{ formatCurrency(totalValue) }}</p>
          </div>
          <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </div>

      <div class="card bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90">Số Lượng Sản Phẩm</p>
            <p class="text-3xl font-bold">{{ totalProducts }}</p>
          </div>
          <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      <div class="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90">Sản Phẩm Cảnh Báo</p>
            <p class="text-3xl font-bold">{{ warningProducts }}</p>
          </div>
          <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Nhập Xuất Gần Đây</h3>
      <div class="space-y-3">
        <div
          v-for="record in recentRecords"
          :key="record.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', record.type === 'import' ? 'bg-green-100' : 'bg-red-100']">
              <svg class="w-5 h-5" :class="record.type === 'import' ? 'text-green-600' : 'text-red-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="record.type === 'import' ? 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' : 'M9 19l3 3m0 0l3-3m-3 3V10'" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-800">{{ record.medicine }}</p>
              <p class="text-xs text-gray-500">{{ formatDateTime(record.date) }}</p>
            </div>
          </div>
          <div class="text-right">
            <p :class="['font-semibold', record.type === 'import' ? 'text-green-600' : 'text-red-600']">
              {{ record.type === 'import' ? '+' : '-' }}{{ record.quantity }}
            </p>
            <p class="text-xs text-gray-500">{{ formatCurrency(record.total) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory Modal -->
    <Modal
      v-model="showInventoryModal"
      :title="inventoryType === 'import' ? 'Nhập Kho' : 'Xuất Kho'"
    >
      <InventoryForm
        :type="inventoryType"
        @success="handleInventorySuccess"
        @cancel="showInventoryModal = false"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import Modal from '@/components/Modal.vue'
import InventoryForm from '@/components/InventoryForm.vue'

const showInventoryModal = ref(false)
const inventoryType = ref<'import' | 'export'>('import')

const recentRecords = ref<any[]>([])
const medicines = ref<any[]>([])
const loading = ref(false)

const totalValue = computed(() => {
  return medicines.value.reduce((sum, m) => sum + (parseFloat(m.price) * m.quantity), 0)
})

const totalProducts = computed(() => medicines.value.length)

const warningProducts = computed(() => {
  const today = new Date()
  return medicines.value.filter(m => {
    if (m.quantity <= m.stock_alert) return true
    const expiryDate = new Date(m.expiry_date)
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }).length
})

async function fetchInventoryData() {
  loading.value = true
  try {
    // Fetch inventory records
    const recordsResponse = await api.get('/inventory', { params: { page: 1, limit: 6 } })
    recentRecords.value = recordsResponse.data.data.map((record: any) => ({
      id: record.id,
      medicine: record.medicine_name,
      type: record.type,
      quantity: record.quantity,
      total: parseFloat(record.medicine_price) * record.quantity,
      date: new Date(record.created_at)
    }))

    // Fetch medicines for stats
    const medicinesResponse = await api.get('/medicines', { params: { page: 1, limit: 100 } })
    medicines.value = medicinesResponse.data.data
  } catch (error) {
    console.error('Error fetching inventory data:', error)
  } finally {
    loading.value = false
  }
}

function openInventoryModal(type: 'import' | 'export') {
  inventoryType.value = type
  showInventoryModal.value = true
}

function handleInventorySuccess() {
  showInventoryModal.value = false
  fetchInventoryData()
}

onMounted(() => {
  fetchInventoryData()
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('vi-VN')
}
</script>

