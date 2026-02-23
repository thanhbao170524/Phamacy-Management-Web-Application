<template>
  <div class="invoice-container">
    <!-- Invoice Header -->
    <div class="text-center mb-6 pb-4 border-b border-gray-300">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">{{ pharmacyName }}</h2>
      <p class="text-sm text-gray-600">{{ pharmacyAddress }}</p>
      <p class="text-sm text-gray-600">ĐT: {{ pharmacyPhone }} | Email: {{ pharmacyEmail }}</p>
    </div>

    <!-- Invoice Info -->
    <div class="mb-6 space-y-2">
      <div class="flex justify-between">
        <span class="text-gray-600">Mã đơn:</span>
        <span class="font-semibold">{{ order.id }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">Ngày bán:</span>
        <span>{{ formatDateTime(order.created_at) }}</span>
      </div>
      <div v-if="order.customer_name" class="flex justify-between">
        <span class="text-gray-600">Khách hàng:</span>
        <span class="font-medium">{{ order.customer_name }}</span>
      </div>
      <div v-if="order.customer_phone" class="flex justify-between">
        <span class="text-gray-600">SĐT:</span>
        <span>{{ order.customer_phone }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">Nhân viên:</span>
        <span>{{ order.staff_name }}</span>
      </div>
    </div>

    <!-- Items Table -->
    <div class="mb-6">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 px-2 font-semibold text-gray-700 text-sm">STT</th>
            <th class="text-left py-2 px-2 font-semibold text-gray-700 text-sm">Tên thuốc</th>
            <th class="text-center py-2 px-2 font-semibold text-gray-700 text-sm">SL</th>
            <th class="text-right py-2 px-2 font-semibold text-gray-700 text-sm">Đơn giá</th>
            <th class="text-right py-2 px-2 font-semibold text-gray-700 text-sm">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in order.items" :key="item.id" class="border-b border-gray-200">
            <td class="py-2 px-2 text-gray-600">{{ index + 1 }}</td>
            <td class="py-2 px-2 font-medium text-gray-800">{{ item.medicine_name }}</td>
            <td class="py-2 px-2 text-center text-gray-600">{{ item.quantity }}</td>
            <td class="py-2 px-2 text-right text-gray-600">{{ formatCurrency(item.price) }}</td>
            <td class="py-2 px-2 text-right font-semibold text-gray-800">{{ formatCurrency(item.subtotal) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="space-y-2 mb-6">
      <div class="flex justify-between text-gray-700">
        <span>Tổng tiền hàng:</span>
        <span>{{ formatCurrency(order.total_amount) }}</span>
      </div>
      <div v-if="order.discount > 0" class="flex justify-between text-gray-700">
        <span>Giảm giá:</span>
        <span class="text-red-600">-{{ formatCurrency(order.discount) }}</span>
      </div>
      <div class="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2 border-gray-300">
        <span>Tổng cộng:</span>
        <span>{{ formatCurrency(order.final_amount) }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
      <p>Cảm ơn quý khách đã mua hàng!</p>
      <p class="mt-2">Hẹn gặp lại quý khách</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  orderId: string
}>()

const order = ref<any>({
  id: '',
  created_at: '',
  customer_name: '',
  customer_phone: '',
  staff_name: '',
  total_amount: 0,
  discount: 0,
  final_amount: 0,
  items: []
})

const pharmacyName = ref('Nhà Thuốc PharmaT')
const pharmacyAddress = ref('')
const pharmacyPhone = ref('')
const pharmacyEmail = ref('')

async function fetchOrderDetails() {
  try {
    const response = await api.get(`/sales/${props.orderId}`)
    order.value = response.data
  } catch (error) {
    console.error('Error fetching order details:', error)
  }
}

async function fetchPharmacyInfo() {
  try {
    const response = await api.get('/settings')
    pharmacyName.value = response.data.pharmacy_name || 'Nhà Thuốc PharmaT'
    pharmacyAddress.value = response.data.pharmacy_address || ''
    pharmacyPhone.value = response.data.pharmacy_phone || ''
    pharmacyEmail.value = response.data.pharmacy_email || ''
  } catch (error) {
    console.error('Error fetching pharmacy info:', error)
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function printInvoice() {
  window.print()
}

onMounted(() => {
  fetchOrderDetails()
  fetchPharmacyInfo()
})

defineExpose({
  printInvoice
})
</script>

<style scoped>
@media print {
  .invoice-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  @page {
    margin: 1cm;
  }

  body * {
    visibility: hidden;
  }

  .invoice-container,
  .invoice-container * {
    visibility: visible;
  }

  .invoice-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>

