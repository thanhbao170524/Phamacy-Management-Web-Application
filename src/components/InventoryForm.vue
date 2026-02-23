<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Loại Giao Dịch <span class="text-red-500">*</span>
      </label>
      <div class="flex gap-4">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="formData.type"
            type="radio"
            value="import"
            class="mr-2"
            required
          />
          <span class="font-medium text-green-700">Nhập Kho</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            v-model="formData.type"
            type="radio"
            value="export"
            class="mr-2"
            required
          />
          <span class="font-medium text-red-700">Xuất Kho</span>
        </label>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Thuốc <span class="text-red-500">*</span>
      </label>
      <select
        v-model="formData.medicine_id"
        required
        class="input-field"
      >
        <option value="">Chọn thuốc</option>
        <option
          v-for="medicine in medicines"
          :key="medicine.id"
          :value="medicine.id"
          :disabled="formData.type === 'export' && medicine.quantity === 0"
        >
          {{ medicine.name }} - 
          {{ formData.type === 'export' ? `Còn ${medicine.quantity}` : '' }}
          {{ formatCurrency(medicine.price) }}
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Số Lượng <span class="text-red-500">*</span>
      </label>
      <input
        v-model.number="formData.quantity"
        type="number"
        min="1"
        :max="formData.type === 'export' ? getAvailableQuantity() : undefined"
        required
        class="input-field"
        placeholder="Nhập số lượng"
      />
      <p v-if="formData.type === 'export' && formData.medicine_id" class="text-xs text-gray-500 mt-1">
        Số lượng có sẵn: {{ getAvailableQuantity() }}
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Ghi Chú
      </label>
      <textarea
        v-model="formData.notes"
        rows="3"
        class="input-field"
        placeholder="Ghi chú về giao dịch..."
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
      <button
        type="submit"
        :disabled="loading"
        class="btn-primary"
      >
        {{ loading ? "Đang lưu..." : formData.type === "import" ? "Nhập Kho" : "Xuất Kho" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Medicine } from "@/types";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

interface Props {
  type?: "import" | "export";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const loading = ref(false);
const medicines = ref<Medicine[]>([]);

const formData = ref({
  type: (props.type || "import") as "import" | "export",
  medicine_id: "",
  quantity: 1,
  user_id: authStore.user?.id || "",
  notes: "",
});

async function fetchMedicines() {
  try {
    const response = await api.get("/medicines", { params: { limit: 100 } });
    medicines.value = response.data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: item.category_name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      expiryDate: item.expiry_date,
      stockAlert: item.stock_alert,
      barcode: item.barcode || "",
      manufacturer: item.manufacturer || "",
    }));
  } catch (error) {
    console.error("Error fetching medicines:", error);
  }
}

function getAvailableQuantity(): number {
  if (!formData.value.medicine_id) return 0;
  const medicine = medicines.value.find(m => m.id === formData.value.medicine_id);
  return medicine ? medicine.quantity : 0;
}

async function handleSubmit() {
  loading.value = true;
  try {
    // Validate export quantity
    if (formData.value.type === "export") {
      const available = getAvailableQuantity();
      if (formData.value.quantity > available) {
        const { error } = await import("@/composables/useToast").then(m => m.useToast());
        error(`Số lượng xuất không được vượt quá ${available}`);
        loading.value = false;
        return;
      }
    }

    const payload = {
      medicine_id: formData.value.medicine_id,
      type: formData.value.type,
      quantity: formData.value.quantity,
      user_id: authStore.user?.id,
      notes: formData.value.notes || null,
    };

    await api.post("/inventory", payload);
    const { success } = await import("@/composables/useToast").then(m => m.useToast());
    success(
      formData.value.type === "import"
        ? "Nhập kho thành công!"
        : "Xuất kho thành công!"
    );
    emit("success");
  } catch (error: any) {
    console.error("Error creating inventory record:", error);
    const { error: showError } = await import("@/composables/useToast").then(m => m.useToast());
    showError(error.response?.data?.error || "Lỗi khi lưu giao dịch");
  } finally {
    loading.value = false;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

onMounted(() => {
  fetchMedicines();
});
</script>

