<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-title text-gray-800"></h1>
      <button @click="editOrder('')" class="btn-primary">
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Tạo Đơn Hàng Mới
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sales Today Stats -->
      <div class="card bg-gradient-primary text-white lg:col-span-1">
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Hôm Nay</h3>
          <div class="space-y-4">
            <div>
              <p class="text-3xl font-bold">{{ formatCurrency(todayStats.revenue) }}</p>
              <p class="text-sm opacity-90">Tổng doanh thu</p>
            </div>
            <div>
              <p class="text-2xl font-bold">{{ todayStats.orders }}</p>
              <p class="text-sm opacity-90">Đơn hàng</p>
            </div>
            <div>
              <p class="text-2xl font-bold">{{ todayStats.customers }}</p>
              <p class="text-sm opacity-90">Khách hàng</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Sales -->
      <div class="card lg:col-span-3">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Đơn Hàng Gần Đây</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Mã Đơn</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Khách Hàng</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Thời Gian</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Tổng Tiền</th>
                <th class="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Trạng Thái</th>
                <th class="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <span class="font-medium text-primary">#{{ order.id }}</span>
                </td>
                <td class="py-3 px-4">
                  <div>
                    <p class="font-medium text-gray-800">{{ order.customer }}</p>
                    <p class="text-xs text-gray-500">NV: {{ order.staff }}</p>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ formatDateTime(order.date) }}</td>
                <td class="py-3 px-4">
                  <span class="font-semibold text-primary">{{ formatCurrency(order.total) }}</span>
                </td>
                <td class="py-3 px-4 text-nowrap text-center">
                  <span :class="getStatusBadgeClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button v-if="order.status === 'pending'" @click="confirmOrder(order.id)"
                      class="px-3 py-1 bg-accent text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      title="Xác nhận/Hoàn thành">
                      Xác nhận
                    </button>
                    <button v-if="order.status === 'pending'" @click="editOrder(order.id)"
                      class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      title="Sửa hóa đơn">
                      Sửa
                    </button>
                    <button v-if="order.status === 'pending'" @click="cancelOrder(order.id)"
                      class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      title="Hủy đơn hàng">
                      Hủy
                    </button>
                    <button v-if="order.status === 'completed'" @click="openInvoiceModal(order.id)"
                      class="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm"
                      title="Xem và in hóa đơn">
                      In hóa đơn
                    </button>
                    <button v-if="order.status === 'completed'" @click="viewOrderDetails(order.id)"
                      class="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      title="Xem chi tiết">
                      Chi tiết
                    </button>
                    <button v-if="order.status === 'cancelled'" @click="viewOrderDetails(order.id)"
                      class="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      title="Xem chi tiết">
                      Chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Top Selling Products -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Sản Phẩm Bán Chạy</h3>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div v-for="product in topProducts" :key="product.id"
          class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 mx-auto">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p class="font-medium text-gray-800 text-center text-sm mb-1">{{ product.name }}</p>
          <p class="text-xs text-gray-600 text-center">Đã bán: {{ product.sold }}</p>
          <p class="text-sm font-semibold text-primary text-center">{{ formatCurrency(product.revenue) }}</p>
        </div>
      </div>
    </div>

    <!-- Order Modal -->
    <Modal v-model="showOrderModal" :title="editingOrderId ? 'Sửa Đơn Hàng' : 'Tạo Đơn Hàng Mới'" size="large">
      <OrderForm :order-id="editingOrderId" @success="handleOrderSuccess" @cancel="handleOrderCancel" />
    </Modal>

    <!-- Invoice Modal -->
    <Modal v-model="showInvoiceModal" title="Hóa Đơn Bán Hàng" size="large">
      <div class="space-y-4">
        <InvoiceModal :order-id="selectedOrderId" ref="invoiceModalRef" />
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button v-if="selectedOrderStatus !== 'cancelled'" @click="printInvoice" class="btn-primary">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In Hóa Đơn
          </button>
          <button @click="showInvoiceModal = false" class="btn-outline">Đóng</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import Modal from '@/components/Modal.vue'
import OrderForm from '@/components/OrderForm.vue'
import InvoiceModal from '@/components/InvoiceModal.vue'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

const todayStats = ref({
  revenue: 0,
  orders: 0,
  customers: 0
})
const recentOrders = ref<any[]>([])
const topProducts = ref<any[]>([])
const loading = ref(false)
const showOrderModal = ref(false)
const showInvoiceModal = ref(false)
const selectedOrderId = ref('')
const selectedOrderStatus = ref<string | null>(null)
const editingOrderId = ref<string | undefined>(undefined)
const invoiceModalRef = ref<InstanceType<typeof InvoiceModal> | null>(null)

async function fetchSalesData() {
  loading.value = true
  try {
    // Fetch today's stats
    const statsResponse = await api.get('/sales/stats/today')
    todayStats.value = {
      revenue: parseFloat(statsResponse.data.revenue) || 0,
      orders: parseInt(statsResponse.data.orders) || 0,
      customers: parseInt(statsResponse.data.customers) || 0
    }

    // Fetch recent orders
    const ordersResponse = await api.get('/sales', { params: { page: 1, limit: 10 } })
    recentOrders.value = ordersResponse.data.data.map((order: any) => ({
      id: order.id,
      customer: order.customer_name || 'Khách vãng lai',
      staff: order.staff_name || '',
      total: parseFloat(order.final_amount) || 0,
      date: new Date(order.created_at),
      status: order.status // Keep original status: 'pending', 'completed', 'cancelled'
    }))

    // Fetch top products (all time)
    try {
      const topProductsResponse = await api.get('/reports/top-products', {
        params: { all_time: true, limit: 5 }
      })
      topProducts.value = topProductsResponse.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        sold: parseInt(item.quantity_sold) || 0,
        revenue: parseFloat(item.revenue) || 0
      }))
    } catch (error) {
      console.error('Error fetching top products:', error)
      topProducts.value = []
    }
  } catch (error) {
    console.error('Error fetching sales data:', error)
  } finally {
    loading.value = false
  }
}

function handleOrderSuccess() {
  showOrderModal.value = false
  editingOrderId.value = undefined
  fetchSalesData()
}

function handleOrderCancel() {
  showOrderModal.value = false
  editingOrderId.value = undefined
}

function editOrder(orderId: string) {
  editingOrderId.value = orderId || undefined
  showOrderModal.value = true
}

onMounted(() => {
  fetchSalesData()
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Đang chờ'
    case 'completed':
      return 'Hoàn thành'
    case 'cancelled':
      return 'Đã hủy'
    default:
      return status
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium'
    case 'completed':
      return 'px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium'
    case 'cancelled':
      return 'px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium'
    default:
      return 'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
  }
}

async function confirmOrder(orderId: string) {
  if (!confirm('Bạn có chắc chắn muốn xác nhận và hoàn thành đơn hàng này?')) {
    return
  }

  try {
    await api.put(`/sales/${orderId}/status`, { status: 'completed' })
    success('Đơn hàng đã được xác nhận thành công!')
    fetchSalesData()
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi xác nhận đơn hàng')
  }
}

async function cancelOrder(orderId: string) {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
    return
  }

  try {
    await api.put(`/sales/${orderId}/status`, { status: 'cancelled' })
    success('Đơn hàng đã được hủy!')
    fetchSalesData()
  } catch (err: any) {
    error(err.response?.data?.error || 'Lỗi khi hủy đơn hàng')
  }
}

function openInvoiceModal(orderId: string) {
  selectedOrderId.value = orderId
  // Tìm order trong danh sách để lấy status
  const order = recentOrders.value.find(o => o.id === orderId)
  selectedOrderStatus.value = order?.status || null
  showInvoiceModal.value = true
}

function viewOrderDetails(orderId: string) {
  openInvoiceModal(orderId)
}

function printInvoice() {
  if (invoiceModalRef.value) {
    invoiceModalRef.value.printInvoice()
  } else {
    window.print()
  }
}
</script>
