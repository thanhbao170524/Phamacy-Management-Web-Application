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
        placeholder="Nhập họ tên thành viên"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          v-model="formData.email"
          type="email"
          class="input-field"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Số Điện Thoại <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.phone"
          type="tel"
          required
          class="input-field"
          placeholder="0901234567"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Hạng Thành Viên <span class="text-red-500">*</span>
        </label>
        <select v-model="formData.level" required class="input-field">
          <option value="">Chọn hạng</option>
          <option value="bronze">Đồng</option>
          <option value="silver">Bạc</option>
          <option value="gold">Vàng</option>
          <option value="platinum">Bạch kim</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Điểm Tích Lũy
        </label>
        <input
          v-model.number="formData.points"
          type="number"
          min="0"
          class="input-field"
          placeholder="0"
        />
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
import type { Member } from "@/types";
import { useToast } from "@/composables/useToast";

const props = defineProps<{
  member?: Member | null;
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
  phone: "",
  level: "bronze",
  points: 0,
});

watch(
  () => props.member,
  (member) => {
    if (member) {
      isEdit.value = true;
      formData.value = {
        name: member.name,
        email: member.email || "",
        phone: member.phone,
        level: member.level,
        points: member.points || 0,
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
    phone: "",
    level: "bronze",
    points: 0,
  };
}

async function handleSubmit() {
  loading.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      email: formData.value.email.trim() || null,
      phone: formData.value.phone.trim(),
      level: formData.value.level,
      points: Number(formData.value.points) || 0,
    };

    if (isEdit.value && props.member) {
      await api.put(`/members/${props.member.id}`, payload);
    } else {
      await api.post("/members", payload);
    }
    emit("success");
  } catch (err: any) {
    console.error("Error saving member:", err);
    error(err.response?.data?.error || "Lỗi khi lưu thành viên");
  } finally {
    loading.value = false;
  }
}
</script>

