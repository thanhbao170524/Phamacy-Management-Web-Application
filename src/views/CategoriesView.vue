<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-title text-gray-800"></h1>
      <button @click="openAddModal" class="btn-primary">
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Thêm Danh Mục Mới
      </button>
    </div>

    <!-- Search and Sort -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Tìm kiếm danh mục</h3>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm theo tên danh mục..." class="input-field" />
        <select v-model="sortBy" class="input-field">
          <option value="name">Sắp xếp theo tên</option>
          <option value="count">Sắp xếp theo số lượng</option>
          <option value="created">Sắp xếp theo ngày tạo</option>
        </select>
        <select v-model="sortOrder" class="input-field">
          <option value="asc">Tăng dần</option>
          <option value="desc">Giảm dần</option>
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
    </div>

    <!-- Categories Table -->
    <div class="card">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="categories.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="mt-4 text-gray-600 font-medium">Không tìm thấy danh mục nào</p>
        <p v-if="searchQuery" class="text-sm text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác</p>
      </div>

      <!-- Table Content -->
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Tên Danh Mục</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Mô Tả</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Số Lượng Thuốc</th>
                <th class="text-left py-3 px-4 font-semibold text-gray-700">Ngày Tạo</th>
                <th class="text-center py-3 px-4 font-semibold text-gray-700">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <button @click="viewCategoryDetails(category)"
                    class="font-medium text-primary hover:text-blue-700 hover:underline cursor-pointer">
                    {{ category.name }}
                  </button>
                </td>
                <td class="py-3 px-4 text-gray-600">
                  {{ category.description || "—" }}
                </td>
                <td class="py-3 px-4">
                  <button @click="viewCategoryDetails(category)"
                    class="font-semibold text-primary hover:text-blue-700 hover:underline cursor-pointer">
                    {{ category.medicineCount }} thuốc
                  </button>
                </td>
                <td class="py-3 px-4 text-gray-600">{{ formatDate(category.createdAt) }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center justify-center gap-2">
                    <button @click="openEditModal(category)" class="text-accent hover:text-green-700" title="Chỉnh sửa">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="handleDelete(category)" class="text-red-500 hover:text-red-700" title="Xóa"
                      :disabled="category.medicineCount > 0"
                      :class="{ 'opacity-50 cursor-not-allowed': category.medicineCount > 0 }">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Category Form Modal -->
    <Modal v-model="showModal" :title="editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'">
      <CategoryForm :category="editingCategory" @success="handleFormSuccess" @cancel="closeModal" />
    </Modal>

    <!-- Category Details Modal (List of Medicines) -->
    <Modal v-model="showDetailsModal" :title="`Danh Sách Thuốc - ${selectedCategory?.name}`" size="large">
      <div v-if="loadingMedicines" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-4 text-gray-600">Đang tải danh sách thuốc...</p>
      </div>
      <div v-else-if="categoryMedicines.length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="mt-4 text-gray-600 font-medium">Danh mục này chưa có thuốc nào</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Tên Thuốc</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Giá</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Số Lượng</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700">Hết Hạn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="medicine in categoryMedicines" :key="medicine.id"
              class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4 font-medium text-gray-800">{{ medicine.name }}</td>
              <td class="py-3 px-4 text-gray-600">{{ formatCurrency(medicine.price) }}</td>
              <td class="py-3 px-4 text-gray-600">{{ medicine.quantity }}</td>
              <td class="py-3 px-4 text-gray-600">
                {{ medicine.expiry_date ? formatDate(medicine.expiry_date) : "—" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Category } from "@/types";
import api from "@/services/api";
import Modal from "@/components/Modal.vue";
import CategoryForm from "@/components/CategoryForm.vue";
import { useToast } from "@/composables/useToast";

const { success, error } = useToast();

const categories = ref<Category[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editingCategory = ref<Category | null>(null);

const searchQuery = ref("");
const sortBy = ref("name");
const sortOrder = ref<"asc" | "desc">("asc");

// Category details modal
const showDetailsModal = ref(false);
const selectedCategory = ref<Category | null>(null);
const categoryMedicines = ref<any[]>([]);
const loadingMedicines = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

async function fetchCategories() {
  loading.value = true;
  try {
    const response = await api.get("/categories", {
      params: {
        search: searchQuery.value || undefined,
        sort: sortBy.value,
        order: sortOrder.value,
      },
    });
    categories.value = response.data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      medicineCount: item.medicineCount || 0,
    }));
  } catch (err) {
    console.error("Error fetching categories:", err);
    error("Không thể tải danh sách danh mục");
    categories.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchCategories();
}

function resetFilters() {
  searchQuery.value = '';
  sortBy.value = 'name';
  sortOrder.value = 'asc';
  // Không tự động tìm kiếm khi reset, chỉ reset giá trị
}

// Modal handlers
function openAddModal() {
  editingCategory.value = null;
  showModal.value = true;
}

function openEditModal(category: Category) {
  editingCategory.value = category;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingCategory.value = null;
}

function handleFormSuccess() {
  closeModal();
  fetchCategories();
}

async function viewCategoryDetails(category: Category) {
  selectedCategory.value = category;
  showDetailsModal.value = true;
  loadingMedicines.value = true;

  try {
    const response = await api.get(`/categories/${category.id}/medicines`);
    categoryMedicines.value = response.data.medicines || [];
  } catch (err) {
    console.error("Error fetching category medicines:", err);
    error("Không thể tải danh sách thuốc");
    categoryMedicines.value = [];
  } finally {
    loadingMedicines.value = false;
  }
}

async function handleDelete(category: Category) {
  if (category.medicineCount > 0) {
    error(
      `Không thể xóa danh mục này vì còn ${category.medicineCount} thuốc đang thuộc danh mục. Vui lòng chuyển các thuốc sang danh mục khác trước khi xóa.`
    );
    return;
  }

  if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
    return;
  }

  try {
    await api.delete(`/categories/${category.id}`);
    success("Xóa danh mục thành công!");
    fetchCategories();
  } catch (err: any) {
    console.error("Error deleting category:", err);
    const errorMessage = err.response?.data?.error || "Không thể xóa danh mục";

    // Handle constraint error
    if (errorMessage.includes("thuốc") || errorMessage.includes("medicine")) {
      error(errorMessage);
    } else {
      error(errorMessage);
    }
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

onMounted(() => {
  fetchCategories();
});
</script>
