<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-title text-gray-800"></h1>
      <div class="flex gap-3">
        <div class="flex gap-2">
          <select v-model="selectedMonth" @change="fetchReports" class="input-field">
            <option :value="1">Tháng 1</option>
            <option :value="2">Tháng 2</option>
            <option :value="3">Tháng 3</option>
            <option :value="4">Tháng 4</option>
            <option :value="5">Tháng 5</option>
            <option :value="6">Tháng 6</option>
            <option :value="7">Tháng 7</option>
            <option :value="8">Tháng 8</option>
            <option :value="9">Tháng 9</option>
            <option :value="10">Tháng 10</option>
            <option :value="11">Tháng 11</option>
            <option :value="12">Tháng 12</option>
          </select>
          <input v-model.number="selectedYear" @change="fetchReports" type="number" min="2020" :max="new Date().getFullYear()" class="input-field w-32" />
        </div>
        <div class="flex gap-3">
          <button @click="exportPDF" class="btn-outline">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất PDF
          </button>
          <button @click="exportExcel" class="btn-outline">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card bg-gradient-primary text-white">
        <p class="text-sm opacity-90 mb-2">Doanh Thu Tháng Này</p>
        <p class="text-3xl font-bold">{{ formatCurrency(monthlyRevenue) }}</p>
        <p class="text-sm mt-2 opacity-75">Tháng {{ selectedMonth }}/{{ selectedYear }}</p>
      </div>
      <div class="card bg-gradient-to-r from-green-500 to-green-600 text-white">
        <p class="text-sm opacity-90 mb-2">Số Đơn Hàng</p>
        <p class="text-3xl font-bold">{{ totalOrders }}</p>
        <p class="text-sm mt-2 opacity-75">Trung bình: {{ formatCurrency(averageOrder) }}</p>
      </div>
      <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <p class="text-sm opacity-90 mb-2">Sản Phẩm Bán Được</p>
        <p class="text-3xl font-bold">{{ itemsSold }}</p>
        <p class="text-sm mt-2 opacity-75">{{ topCategory }} bán chạy nhất</p>
      </div>
      <div class="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <p class="text-sm opacity-90 mb-2">Khách Hàng Mới</p>
        <p class="text-3xl font-bold">{{ newCustomers }}</p>
        <p class="text-sm mt-2 opacity-75">Tháng {{ selectedMonth }}/{{ selectedYear }}</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Chart -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Doanh Thu Theo Ngày</h3>
        <div v-if="loading" class="h-64">
          <SkeletonLoader type="default" />
        </div>
        <div v-else-if="dailySales.length === 0" class="h-64 flex items-center justify-center text-gray-500">
          Không có dữ liệu
        </div>
        <div v-else class="h-64 flex items-end justify-start gap-1 overflow-x-auto pb-4 px-2">
          <div
            v-for="(day, index) in dailySales"
            :key="index"
            class="flex flex-col items-center flex-shrink-0"
            style="min-width: 28px;"
          >
            <div
              class="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg hover:opacity-80 transition-all cursor-pointer"
              :style="getBarStyle(day, dailySales)"
              :title="`Ngày ${day.label}: ${formatCurrency(day.value)}`"
            ></div>
            <span class="text-xs text-gray-600 mt-2 whitespace-nowrap">{{ day.label }}</span>
            <span class="text-xs font-medium text-gray-800 mt-1 whitespace-nowrap">{{ formatRevenueShort(day.value || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Category Distribution -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Phân Bố Danh Mục</h3>
        <div v-if="loading">
          <SkeletonLoader type="default" />
        </div>
        <div v-else-if="categorySales.length === 0" class="text-center py-8 text-gray-500">
          Không có dữ liệu
        </div>
        <div v-else class="space-y-4">
          <div v-for="category in categorySales" :key="category.name" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ category.name }}</span>
              <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(category.value) }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="['h-2 rounded-full transition-all', category.color]"
                :style="{ width: categorySales.length > 0 ? `${(category.value / Math.max(...categorySales.map(c => c.value || 1), 1)) * 100}%` : '0%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Performance -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Top 10 Sản Phẩm Bán Chạy</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">STT</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Tên Sản Phẩm</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Danh Mục</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Số Lượng</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Doanh Thu</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Tỷ Lệ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(product, index) in topProducts"
              :key="product.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 text-gray-600">#{{ index + 1 }}</td>
              <td class="py-3 px-4 font-medium text-gray-800">{{ product.name }}</td>
              <td class="py-3 px-4 text-gray-600">{{ product.category }}</td>
              <td class="py-3 px-4 text-gray-800">{{ product.quantity }}</td>
              <td class="py-3 px-4 font-semibold text-primary">{{ formatCurrency(product.revenue) }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-primary h-2 rounded-full"
                      :style="{ width: `${product.percentage}%` }"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-600">{{ product.percentage }}%</span>
                </div>
              </td>
            </tr>
            <tr v-if="topProducts.length === 0 && !loading">
              <td colspan="6" class="py-8 text-center text-gray-500">Không có dữ liệu</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { exportToPDF, exportToExcel } from '@/utils/export'
import { useToast } from '@/composables/useToast'

const loading = ref(false)
const monthlyRevenue = ref(0)
const totalOrders = ref(0)
const averageOrder = ref(0)
const itemsSold = ref(0)
const topCategory = ref('N/A')
const newCustomers = ref(0)

const dailySales = ref<Array<{ label: string; value: number }>>([])
const categorySales = ref<Array<{ name: string; value: number; color: string }>>([])
const topProducts = ref<Array<{ id: string; name: string; category: string; quantity: number; revenue: number; percentage: number }>>([])

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const { success, error } = useToast()

const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-indigo-500']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatRevenueShort(value: number): string {
  if (value === 0) return '0'
  
  // Nếu >= 1 triệu, dùng M với 2 chữ số thập phân
  if (value >= 1000000) {
    const millions = value / 1000000
    // Làm tròn đến 2 chữ số thập phân
    const rounded = Math.round(millions * 100) / 100
    // Nếu là số nguyên, hiển thị không có thập phân
    if (rounded % 1 === 0) {
      return `${rounded}M`
    }
    // Nếu có thập phân, hiển thị tối đa 2 chữ số và loại bỏ số 0 cuối
    const formatted = rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
    return `${formatted}M`
  }
  
  // Nếu < 1 triệu, dùng K
  const thousands = Math.round(value / 1000)
  return `${thousands}K`
}

function getBarStyle(day: { label: string; value: number }, allValues: Array<{ label: string; value: number }>) {
  const currentValue = day.value || 0
  const maxValue = Math.max(...allValues.map(d => d.value || 0), 0)

  // Nếu không có dữ liệu hoặc giá trị = 0
  if (maxValue === 0 || currentValue === 0) {
    return { height: '0px', minHeight: '0px' }
  }

  // Tính chiều cao theo tỷ lệ phần trăm và chuyển sang pixel
  // Container có height h-64 (256px), trừ đi khoảng cách cho labels (~80px)
  const availableHeight = 176 // 256px - 80px cho labels
  const heightPercent = (currentValue / maxValue) * 100
  const heightInPx = Math.max((heightPercent / 100) * availableHeight, currentValue > 0 ? 8 : 0)

  return {
    height: `${heightInPx}px`,
    minHeight: currentValue > 0 ? '8px' : '0px',
    maxHeight: `${availableHeight}px`
  }
}

async function fetchReports() {
  loading.value = true
  try {
    // Fetch comprehensive report
    const comprehensiveRes = await api.get('/reports/comprehensive', {
      params: { month: selectedMonth.value, year: selectedYear.value }
    })
    const data = comprehensiveRes.data
    monthlyRevenue.value = data.monthlyRevenue || 0
    totalOrders.value = data.totalOrders || 0
    averageOrder.value = data.averageOrder || 0
    itemsSold.value = data.itemsSold || 0
    topCategory.value = data.topCategory || 'N/A'
    newCustomers.value = data.newCustomers || 0

    // Fetch daily sales
    const dailyRes = await api.get('/reports/daily-sales', {
      params: { month: selectedMonth.value, year: selectedYear.value }
    })
    // Map to array with all days of month (fill missing days with 0)
    const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const salesMap = new Map()
    dailyRes.data.forEach((item: any) => {
      salesMap.set(item.day, parseFloat(item.revenue) || 0)
    })
    
    dailySales.value = []
    for (let day = 1; day <= daysInMonth; day++) {
      dailySales.value.push({
        label: String(day),
        value: salesMap.get(day) || 0
      })
    }

    // Fetch category sales
    const categoryRes = await api.get('/reports/category-sales', {
      params: { month: selectedMonth.value, year: selectedYear.value }
    })
    categorySales.value = categoryRes.data.map((item: any, index: number) => ({
      name: item.category_name,
      value: parseFloat(item.revenue) || 0,
      color: categoryColors[index % categoryColors.length]
    }))

    // Fetch top products
    const productsRes = await api.get('/reports/top-products', {
      params: { month: selectedMonth.value, year: selectedYear.value, limit: 10 }
    })
    topProducts.value = productsRes.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category_name,
      quantity: parseInt(item.quantity_sold) || 0,
      revenue: parseFloat(item.revenue) || 0,
      percentage: parseFloat(item.percentage) || 0
    }))
  } catch (error) {
    console.error('Error fetching reports:', error)
  } finally {
    loading.value = false
  }
}

async function exportPDF() {
  try {
    const reportData = {
      'Doanh thu tháng': formatCurrency(monthlyRevenue.value),
      'Số đơn hàng': totalOrders.value,
      'Trung bình/đơn': formatCurrency(averageOrder.value),
      'Sản phẩm bán được': itemsSold.value,
      'Danh mục bán chạy': topCategory.value,
      'Khách hàng mới': newCustomers.value,
    };
    await exportToPDF(reportData, `Báo cáo tháng ${selectedMonth.value}/${selectedYear.value}`);
    success('Xuất PDF thành công!');
  } catch (err: any) {
    error(err.message || 'Lỗi khi xuất PDF');
  }
}

async function exportExcel() {
  try {
    const headers = ['STT', 'Tên sản phẩm', 'Danh mục', 'Số lượng', 'Doanh thu', 'Tỷ lệ %'];
    const excelData = topProducts.value.map((product, index) => ({
      'STT': index + 1,
      'Tên sản phẩm': product.name,
      'Danh mục': product.category,
      'Số lượng': product.quantity,
      'Doanh thu': product.revenue,
      'Tỷ lệ %': product.percentage,
    }));
    await exportToExcel(excelData, `Báo cáo sản phẩm ${selectedMonth.value}-${selectedYear.value}`, headers);
    success('Xuất Excel thành công!');
  } catch (err: any) {
    error(err.message || 'Lỗi khi xuất Excel');
  }
}

onMounted(() => {
  fetchReports()
})
</script>

