<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Tên Thuốc <span class="text-red-500">*</span>
      </label>
      <input
        v-model="formData.name"
        type="text"
        required
        class="input-field"
        placeholder="Nhập tên thuốc"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Mô Tả
      </label>
      <textarea
        v-model="formData.description"
        rows="3"
        class="input-field"
        placeholder="Mô tả về thuốc"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Danh Mục <span class="text-red-500">*</span>
        </label>
        <select v-model="formData.category_id" required class="input-field">
          <option value="">Chọn danh mục</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Giá (VNĐ) <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="formData.price"
          type="number"
          min="0"
          step="1000"
          required
          class="input-field"
          placeholder="0"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Số Lượng <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="formData.quantity"
          type="number"
          min="0"
          required
          class="input-field"
          placeholder="0"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Ngày Hết Hạn <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.expiry_date"
          type="date"
          required
          class="input-field"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Cảnh Báo Tồn Kho
        </label>
        <input
          v-model.number="formData.stock_alert"
          type="number"
          min="0"
          class="input-field"
          placeholder="20"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Mã Vạch
        </label>
        <input
          v-model="formData.barcode"
          type="text"
          class="input-field"
          placeholder="Mã vạch"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Nhà Sản Xuất
      </label>
      <input
        v-model="formData.manufacturer"
        type="text"
        class="input-field"
        placeholder="Tên nhà sản xuất"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Hủy
      </button>
      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? "Đang lưu..." : isEdit ? "Cập Nhật" : "Thêm Mới" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { Medicine } from "@/types";
import api from "@/services/api";

interface Props {
  medicine?: Medicine | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const loading = ref(false);
const categories = ref<any[]>([]);
const isEdit = ref(false);

const formData = ref({
  name: "",
  description: "",
  category_id: "",
  price: 0,
  quantity: 0,
  expiry_date: "",
  stock_alert: 20,
  barcode: "",
  manufacturer: "",
});

async function fetchCategories() {
  try {
    // Fetch categories - we'll create this endpoint
    const response = await api.get("/medicines/categories");
    categories.value = response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Fallback to hardcoded if endpoint doesn't exist yet
    categories.value = [
      { id: 1, name: "Kháng sinh" },
      { id: 2, name: "Giảm đau" },
      { id: 3, name: "Vitamin" },
    ];
  }
}

async function findCategoryIdByName(categoryName: string): Promise<string> {
  const category = categories.value.find((c) => c.name === categoryName);
  return category ? String(category.id) : "";
}

// Helper function to convert date to yyyy-MM-dd format
function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    // Get local date in yyyy-MM-dd format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

watch(
  () => props.medicine,
  async (medicine) => {
    if (medicine) {
      isEdit.value = true;
      const categoryId = await findCategoryIdByName(medicine.category);
      formData.value = {
        name: medicine.name,
        description: medicine.description || "",
        category_id: categoryId,
        price: medicine.price,
        quantity: medicine.quantity,
        expiry_date: formatDateForInput(medicine.expiryDate),
        stock_alert: medicine.stockAlert,
        barcode: medicine.barcode || "",
        manufacturer: medicine.manufacturer || "",
      };
    } else {
      isEdit.value = false;
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  formData.value = {
    name: "",
    description: "",
    category_id: "",
    price: 0,
    quantity: 0,
    expiry_date: "",
    stock_alert: 20,
    barcode: "",
    manufacturer: "",
  };
}

async function handleSubmit() {
  loading.value = true;
  try {
    // Ensure date is in yyyy-MM-dd format
    let expiryDate = formData.value.expiry_date;
    if (expiryDate) {
      // If date contains time, extract just the date part
      if (expiryDate.includes("T")) {
        expiryDate = expiryDate.split("T")[0];
      }
      // Validate format
      const dateMatch = expiryDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!dateMatch) {
        throw new Error(
          "Định dạng ngày không hợp lệ. Vui lòng nhập ngày theo định dạng YYYY-MM-DD"
        );
      }
    }

    const payload = {
      ...formData.value,
      category_id: String(formData.value.category_id), // Ensure it's a string
      price: Number(formData.value.price),
      quantity: Number(formData.value.quantity),
      stock_alert: Number(formData.value.stock_alert) || 20,
      expiry_date: expiryDate,
      // Remove empty strings for optional fields
      barcode: formData.value.barcode?.trim() || null,
      manufacturer: formData.value.manufacturer?.trim() || null,
    };

    if (isEdit.value && props.medicine) {
      await api.put(`/medicines/${props.medicine.id}`, payload);
      emit("success");
    } else {
      await api.post("/medicines", payload);
      emit("success");
    }
  } catch (error: any) {
    console.error("Error saving medicine:", error);
    const { useToast } = await import("@/composables/useToast");
    const { error: showError } = useToast();
    const errorMessage =
      error.response?.data?.error || error.message || "Lỗi khi lưu thuốc";
    showError(errorMessage);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchCategories();
});
</script>
