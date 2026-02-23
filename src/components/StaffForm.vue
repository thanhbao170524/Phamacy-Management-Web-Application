<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Họ Tên <span class="text-red-500">*</span>
      </label>
      <input
        v-model="formData.name"
        type="text"
        required
        class="input-field"
        placeholder="Nhập họ tên nhân viên"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Email <span class="text-red-500">*</span>
      </label>
      <input
        v-model="formData.email"
        type="email"
        required
        class="input-field"
        placeholder="email@example.com"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Mật Khẩu <span class="text-red-500">*</span>
          <span v-if="isEdit" class="text-xs text-gray-500 font-normal">(Để trống nếu không đổi)</span>
        </label>
        <input
          v-model="formData.password"
          type="password"
          :required="!isEdit"
          class="input-field"
          placeholder="Nhập mật khẩu"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Số Điện Thoại
        </label>
        <input
          v-model="formData.phone"
          type="tel"
          class="input-field"
          placeholder="0901234567"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Vai Trò <span class="text-red-500">*</span>
        </label>
        <select v-model="formData.role" required class="input-field">
          <option value="">Chọn vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="sales_staff">Nhân viên bán hàng</option>
          <option value="inventory_staff">Nhân viên quản lý kho</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Trạng Thái
        </label>
        <select v-model="formData.active" class="input-field">
          <option :value="true">Hoạt động</option>
          <option :value="false">Ngừng hoạt động</option>
        </select>
      </div>
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
import type { Staff } from "@/types";
import { useToast } from "@/composables/useToast";

const props = defineProps<{
  staff?: Staff | null;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const { success, error } = useToast();
const loading = ref(false);
const isEdit = ref(false);

const formData = ref({
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "",
  active: true,
});

watch(
  () => props.staff,
  (staff) => {
    if (staff) {
      isEdit.value = true;
      formData.value = {
        name: staff.name,
        email: staff.email,
        password: "", // Don't prefill password
        phone: staff.phone || "",
        role: staff.role,
        active: staff.active,
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
    email: "",
    password: "",
    phone: "",
    role: "",
    active: true,
  };
}

async function handleSubmit() {
  loading.value = true;
  try {
    const payload: any = {
      name: formData.value.name.trim(),
      email: formData.value.email.trim().toLowerCase(),
      phone: formData.value.phone.trim() || null,
      role: formData.value.role,
      active: formData.value.active,
    };

    // Only include password if it's provided (for edit) or required (for create)
    if (!isEdit.value || formData.value.password.trim()) {
      payload.password = formData.value.password;
    }

    if (isEdit.value && props.staff) {
      await api.put(`/staff/${props.staff.id}`, payload);
    } else {
      await api.post("/staff", payload);
    }
    emit("success");
  } catch (err: any) {
    console.error("Error saving staff:", err);
    error(err.response?.data?.error || "Lỗi khi lưu nhân viên");
  } finally {
    loading.value = false;
  }
}
</script>

