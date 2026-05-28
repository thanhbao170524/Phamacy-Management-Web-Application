<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-title text-gray-800"></h1>
      <button v-if="canEdit" @click="openAddModal" class="btn-primary">
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Thêm Thuốc Mới
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Tìm kiếm thuốc</h3>
        <button v-if="!showAdvancedFilters" @click="showAdvancedFilters = true"
          class="text-sm text-primary hover:underline">
          Mở rộng
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm theo tên, mã vạch..." class="input-field" />
        <select v-model="selectedCategory" class="input-field">
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
        </select>
        <select v-model="stockFilter" class="input-field">
          <option value="">Tất cả trạng thái</option>
          <option value="expired">Hết hạn</option>
          <option value="low">Hết hàng</option>
          <option value="expiring">Sắp hết hạn</option>
          <option value="low_stock">Sắp hết hàng</option>
          <option value="available">Còn hàng</option>
        </select>
        <button @click="resetFilters" class="btn-secondary">
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Đặt lại
        </button>
        <button @click="handleSearch" class="btn-primary">
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm kiếm
        </button>

      </div>


      <!-- Advanced Filters Panel -->
      <div v-if="showAdvancedFilters" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Bộ Lọc Nâng Cao</h3>
          <button @click="showAdvancedFilters = false" class="text-sm text-primary hover:underline">
            Thu gọn
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Khoảng giá từ</label>
            <input v-model.number="priceMin" type="number" min="0" step="1000" class="input-field" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Đến</label>
            <input v-model.number="priceMax" type="number" min="0" step="1000" class="input-field"
              placeholder="Không giới hạn" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Số lượng tối thiểu</label>
            <input v-model.number="quantityMin" type="number" min="0" class="input-field" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nhà sản xuất</label>
            <input v-model="manufacturerFilter" type="text" class="input-field" placeholder="Tìm theo NSX..." />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="loading" class="py-12">
        <SkeletonLoader type="table" :rows="6" :columns="7" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredMedicines.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="mt-4 text-gray-600 font-medium">Không tìm thấy thuốc nào</p>
        <p class="text-sm text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
      </div>

      <!-- Table Content -->
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Tên Thuốc</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Mã Vạch</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Danh Mục</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Giá</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Số Lượng</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Số Lượng Tối Thiểu</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Hết Hạn</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Trạng Thái</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Nhà Sản Xuất</th>
                <th class="text-center py-3 px-4 font-semibold text-gray-700">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="medicine in pagedMedicines" :key="medicine.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <p class="font-medium text-gray-800">{{ medicine.name }}</p>
                </td>
                <td class="py-3 px-4">
                  <p class="text-sm text-gray-600">{{ medicine.barcode || '-' }}</p>
                </td>
                <td class="py-3 px-4 text-gray-600">{{ medicine.category }}</td>
                <td class="py-3 px-4">
                  <span class="font-semibold text-primary">{{ formatCurrency(medicine.price) }}</span>
                </td>
                <td class="py-3 px-4">
                  <span :class="getStockClass(medicine.quantity, medicine.stockAlert)">
                    {{ medicine.quantity }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">
                  {{ medicine.stockAlert || '-' }}
                </td>
                <td class="py-3 px-4 text-gray-600">{{ formatDate(medicine.expiryDate) }}</td>
                <td class="py-3 px-4 text-nowrap">
                  <span :class="getStatusBadge(medicine)">
                    {{ getStatusText(medicine) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">
                  {{ medicine.manufacturer || '-' }}
                </td>
                <td class="py-3 px-4">
                  <div v-if="canEdit" class="flex items-center justify-center gap-2">
                    <button @click="openEditModal(medicine)" class="text-primary hover:text-blue-700" title="Sửa">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="confirmDelete(medicine)" class="text-red-600 hover:text-red-700" title="Xóa">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-gray-400 text-sm">Chỉ xem</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="mt-6 flex items-center justify-between">
          <p class="text-sm text-gray-600">
            Hiển thị
            {{ (currentPage - 1) * pageSize + (pagedMedicines.length ? 1 : 0) }} -
            {{ (currentPage - 1) * pageSize + pagedMedicines.length }}
            trong tổng số {{ filteredMedicines.length }} kết quả
          </p>
          <div class="flex gap-2">
            <button :disabled="currentPage === 1" @click="currentPage--"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Trước</button>
            <button v-for="n in totalPages" :key="n" class="px-3 py-1"
              :class="n === currentPage ? 'bg-primary text-white rounded-lg' : 'border border-gray-300 rounded-lg hover:bg-gray-50'"
              @click="currentPage = n">{{ n }}</button>
            <button :disabled="currentPage === totalPages" @click="currentPage++"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Sau</button>
          </div>
        </div>
      </template>
    </div>

    <!-- Medicine Modal -->
    <Modal v-model="showModal" :title="editingMedicine ? 'Sửa Thuốc' : 'Thêm Thuốc Mới'">
      <MedicineForm :medicine="editingMedicine" @success="handleFormSuccess" @cancel="closeModal" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Medicine } from '@/types'
import { UserRole } from '@/types'
import api from '@/services/api'
import Modal from '@/components/Modal.vue'
import MedicineForm from '@/components/MedicineForm.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const { success, error } = useToast()
const authStore = useAuthStore()

// Check if user can edit medicines (Admin and Inventory Staff only)
const canEdit = computed(() => {
  if (!authStore.user) return false
  return authStore.user.role === UserRole.ADMIN || authStore.user.role === UserRole.INVENTORY_STAFF
})

const searchQuery = ref('')
const selectedCategory = ref('')
const stockFilter = ref('')
const showAdvancedFilters = ref(false)
const priceMin = ref<number | undefined>(undefined)
const priceMax = ref<number | undefined>(undefined)
const quantityMin = ref<number | undefined>(undefined)
const manufacturerFilter = ref('')
const categories = ref<Array<{ id: number; name: string }>>([])
const medicines = ref<Medicine[]>([])
const loading = ref(false)
const totalItems = ref(0)
const showModal = ref(false)
const editingMedicine = ref<Medicine | null>(null)

function handleSearch() {
  fetchMedicines()
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  stockFilter.value = ''
  priceMin.value = undefined
  priceMax.value = undefined
  quantityMin.value = undefined
  manufacturerFilter.value = ''
  // Không tự động tìm kiếm khi reset, chỉ reset giá trị
}

// Fetch medicines from API
async function fetchMedicines() {
  loading.value = true
  try {
    const response = await api.get('/medicines', {
      params: {
        search: searchQuery.value || undefined,
        category: selectedCategory.value || undefined,
        page: 1,
        limit: 100 // Get all for now
      }
    })

    // Transform backend data to frontend format
    medicines.value = response.data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      category: item.category_name, // Backend returns category_name
      price: parseFloat(item.price),
      quantity: item.quantity,
      expiryDate: item.expiry_date, // Backend returns expiry_date
      stockAlert: item.stock_alert,
      barcode: item.barcode || '',
      manufacturer: item.manufacturer || ''
    }))

    totalItems.value = response.data.total
  } catch (error) {
    console.error('Error fetching medicines:', error)
    medicines.value = []
  } finally {
    loading.value = false
  }
}

// Fetch categories
async function fetchCategories() {
  try {
    const response = await api.get('/medicines/categories')
    categories.value = response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

// Client-side filtering with advanced options
const filteredMedicines = computed(() => {
  return medicines.value.filter(med => {
    // Lọc theo tìm kiếm (tên, barcode)
    const searchLower = searchQuery.value.toLowerCase()
    const matchesSearch = !searchQuery.value ||
      med.name.toLowerCase().includes(searchLower) ||
      (med.barcode && med.barcode.toLowerCase().includes(searchLower))

    // Lọc theo danh mục
    const matchesCategory = !selectedCategory.value || med.category === selectedCategory.value

    // Lọc theo trạng thái
    let matchesStock = true
    if (stockFilter.value) {
      const daysUntilExpiry = Math.floor((new Date(med.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      if (stockFilter.value === 'expired') {
        matchesStock = daysUntilExpiry < 0 && med.quantity > 0
      } else if (stockFilter.value === 'low') {
        matchesStock = med.quantity === 0
      } else if (stockFilter.value === 'expiring') {
        matchesStock = daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && med.quantity > 0
      } else if (stockFilter.value === 'low_stock') {
        matchesStock = med.quantity > 0 && med.quantity <= med.stockAlert
      } else if (stockFilter.value === 'available') {
        matchesStock = med.quantity > med.stockAlert && daysUntilExpiry > 30
      }
    }

    // Advanced filters
    const matchesPrice = (!priceMin.value || med.price >= priceMin.value) &&
      (!priceMax.value || med.price <= priceMax.value)
    const matchesQuantity = !quantityMin.value || med.quantity >= quantityMin.value
    const matchesManufacturer = !manufacturerFilter.value ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(manufacturerFilter.value.toLowerCase()))

    return matchesSearch && matchesCategory && matchesStock && matchesPrice && matchesQuantity && matchesManufacturer
  })
})

const pageSize = ref(6)
const currentPage = ref(1)

const pagedMedicines = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMedicines.value.slice(start, end)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMedicines.value.length / pageSize.value)))

watch(filteredMedicines, () => { currentPage.value = 1 })

// Fetch on mount
onMounted(() => {
  fetchCategories()
  fetchMedicines()
})

// Đã xóa auto-search, chỉ tìm khi nhấn nút Tìm kiếm

// Modal handlers
function openAddModal() {
  editingMedicine.value = null
  showModal.value = true
}

function openEditModal(medicine: Medicine) {
  editingMedicine.value = medicine
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMedicine.value = null
}

function handleFormSuccess() {
  closeModal()
  fetchMedicines()
  success('Thuốc đã được lưu thành công!')
}

async function confirmDelete(medicine: Medicine) {
  if (confirm(`Bạn có chắc chắn muốn xóa "${medicine.name}"?`)) {
    try {
      await api.delete(`/medicines/${medicine.id}`)
      success('Thuốc đã được xóa thành công!')
      fetchMedicines()
    } catch (err: any) {
      error(err.response?.data?.error || 'Lỗi khi xóa thuốc')
    }
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

function getStockClass(quantity: number, stockAlert?: number): string {
  if (quantity === 0) return 'text-red-600 font-semibold'
  if (stockAlert && quantity <= stockAlert) return 'text-yellow-600 font-semibold'
  return 'text-gray-800'
}

function getStatusBadge(medicine: Medicine): string {
  const daysUntilExpiry = Math.floor((new Date(medicine.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // Ưu tiên: Hết hạn > Hết hàng > Sắp hết hạn > Sắp hết hàng > Còn hàng
  if (daysUntilExpiry < 0 && medicine.quantity > 0) return 'px-3 py-1 bg-red-500 text-white rounded-full text-xs'
  if (medicine.quantity === 0) return 'px-3 py-1 bg-red-500 text-white rounded-full text-xs'
  if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && medicine.quantity > 0) return 'px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs'
  if (medicine.quantity > 0 && medicine.quantity <= medicine.stockAlert) return 'px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs'
  return 'px-3 py-1 bg-accent/20 text-accent rounded-full text-xs'
}

function getStatusText(medicine: Medicine): string {
  const daysUntilExpiry = Math.floor((new Date(medicine.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // Ưu tiên: Hết hạn > Hết hàng > Sắp hết hạn > Sắp hết hàng > Còn hàng
  if (daysUntilExpiry < 0 && medicine.quantity > 0) return 'Hết hạn'
  if (medicine.quantity === 0) return 'Hết hàng'
  if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && medicine.quantity > 0) return 'Sắp hết hạn'
  if (medicine.quantity > 0 && medicine.quantity <= medicine.stockAlert) return 'Sắp hết hàng'
  return 'Còn hàng'
}
</script>
