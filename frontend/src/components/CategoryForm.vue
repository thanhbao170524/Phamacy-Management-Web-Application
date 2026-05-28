<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Tên Danh Mục <span class="text-red-500">*</span>
      </label>
      <input
        v-model="formData.name"
        type="text"
        required
        class="input-field"
        :class="{ 'border-red-500': errors.name }"
        placeholder="Nhập tên danh mục (ví dụ: Thuốc giảm đau)"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Mô Tả
      </label>
      <textarea
        v-model="formData.description"
        rows="3"
        class="input-field"
        placeholder="Nhập mô tả danh mục (tùy chọn)"
      ></textarea>
    </div>

    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="loading">Đang lưu...</span>
        <span v-else>{{ isEdit ? "Cập Nhật" : "Thêm Mới" }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import api from "@/services/api";
import type { Category } from "@/types";
import { useToast } from "@/composables/useToast";

const props = defineProps<{
  category?: Category | null;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const { success, error } = useToast();
const loading = ref(false);
const isEdit = ref(false);
const errors = ref<{ name?: string }>({});

const formData = ref({
  name: "",
  description: "",
});

watch(
  () => props.category,
  (category) => {
    if (category) {
      isEdit.value = true;
      formData.value = {
        name: category.name,
        description: category.description || "",
      };
      errors.value = {};
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
  };
  errors.value = {};
}

async function handleSubmit() {
  // Clear previous errors
  errors.value = {};

  // Validate
  if (!formData.value.name || formData.value.name.trim() === "") {
    errors.value.name = "Tên danh mục không được để trống";
    return;
  }

  loading.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || null,
    };

    if (isEdit.value && props.category) {
      await api.put(`/categories/${props.category.id}`, payload);
      success("Cập nhật danh mục thành công!");
    } else {
      await api.post("/categories", payload);
      success("Thêm danh mục thành công!");
    }
    emit("success");
  } catch (err: any) {
    console.error("Error saving category:", err);
    const errorMessage = err.response?.data?.error || "Lỗi khi lưu danh mục";
    
    // Handle duplicate name error
    if (errorMessage.includes("đã tồn tại") || errorMessage.includes("already exists")) {
      errors.value.name = "Tên danh mục đã tồn tại trong hệ thống";
    } else {
      error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
}
</script>
