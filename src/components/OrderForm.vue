<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Customer Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Khách Hàng (Tùy chọn)
      </label>
      <select v-model="formData.customer_id" class="input-field" @change="handleCustomerChange">
        <option value="">Khách vãng lai</option>
        <option v-for="member in members" :key="member.id" :value="member.id">
          {{ member.name }} - {{ member.phone }} {{ member.level ? `(${getLevelLabel(member.level)})` : '' }}
        </option>
      </select>
      <div v-if="selectedCustomer" class="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-gray-700">
          <span class="font-medium">Thành viên: </span>
          <span class="text-blue-700 font-semibold">{{ getLevelLabel(selectedCustomer.level) }}</span>
        </p>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <div>
            <p class="text-xs text-gray-600">Điểm hiện tại:</p>
            <p class="text-sm font-semibold text-primary">{{ selectedCustomer.points || 0 }} điểm</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Giảm giá:</p>
            <p v-if="memberDiscount > 0" class="text-sm font-semibold text-green-700">
              {{ getDiscountPercent(selectedCustomer.level) }}% ({{ formatCurrency(memberDiscount) }})
            </p>
            <p v-else class="text-sm text-gray-500">Không có</p>
          </div>
        </div>
        <div v-if="memberDiscount > 0 && finalAmount > 0" class="mt-2 pt-2 border-t border-blue-200">
          <p class="text-xs text-gray-600">Điểm tích lũy sẽ nhận:</p>
          <p class="text-sm font-bold text-primary">{{ calculatePointsToReceive(selectedCustomer.level, finalAmount) }}
            điểm</p>
          <p class="text-xs text-gray-500 mt-1">
            ({{ getPointsPer10k(selectedCustomer.level) }} điểm / 10,000đ)
          </p>
        </div>
      </div>
    </div>

    <!-- Add Medicine to Order -->
    <div class="border border-gray-200 rounded-lg p-4">
      <h3 class="font-semibold text-gray-800 mb-3">Thêm Sản Phẩm</h3>
      <div class="flex gap-2 mb-3">
        <select v-model="selectedMedicineId" class="flex-1 input-field">
          <option value="">Chọn thuốc</option>
          <option v-for="medicine in medicines" :key="medicine.id" :value="medicine.id"
            :disabled="isMedicineDisabled(medicine)">
            {{ medicine.name }}{{ getMedicineStatus(medicine) ? ` - ${getMedicineStatus(medicine)}` : ` - Còn
            ${medicine.quantity} - ${formatCurrency(medicine.price)}` }}
          </option>
        </select>
        <input v-model.number="medicineQuantity" type="number" min="1" placeholder="Số lượng"
          class="w-24 input-field" />
        <button type="button" @click="addItem"
          :disabled="!selectedMedicineId || !medicineQuantity || medicineQuantity <= 0" class="btn-primary">
          Thêm
        </button>
      </div>

      <!-- Order Items List -->
      <div v-if="formData.items.length > 0" class="space-y-2 mt-4">
        <div v-for="(item, index) in formData.items" :key="index"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex-1">
            <p class="font-medium text-gray-800">{{ item.medicine?.name || 'Đang tải...' }}</p>
            <p class="text-sm text-gray-600">
              {{ item.quantity }} x {{ formatCurrency(item.price) }} = {{ formatCurrency(item.subtotal) }}
            </p>
          </div>
          <button type="button" @click="removeItem(index)" class="text-red-600 hover:text-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Discount -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Giảm Giá (VNĐ)
        <span v-if="memberDiscount > 0" class="text-sm text-green-600 font-normal">
          (Tự động: {{ formatCurrency(memberDiscount) }})
        </span>
      </label>
      <input v-model.number="formData.discount" type="number" min="0" :max="totalAmount" step="1000" class="input-field"
        placeholder="0" :disabled="memberDiscount > 0" />
      <p v-if="memberDiscount > 0" class="text-xs text-gray-500 mt-1">
        Giảm giá tự động đã được áp dụng dựa vào cấp độ thành viên
      </p>
    </div>

    <!-- Total -->
    <div class="bg-primary/10 rounded-lg p-4">
      <div class="flex justify-between items-center mb-2">
        <span class="font-medium text-gray-700">Tổng tiền:</span>
        <span class="text-xl font-bold text-primary">{{ formatCurrency(totalAmount) }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="font-medium text-gray-700">Giảm giá:</span>
        <span class="text-lg font-semibold text-gray-600">- {{ formatCurrency(formData.discount) }}</span>
      </div>
      <div class="flex justify-between items-center pt-2 border-t border-gray-300 mt-2">
        <span class="font-bold text-gray-800">Thành tiền:</span>
        <span class="text-2xl font-bold text-primary">{{ formatCurrency(finalAmount) }}</span>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <button type="button" @click="$emit('cancel')"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
        Hủy
      </button>
      <button type="submit" :disabled="loading || formData.items.length === 0" class="btn-primary">
        {{ loading ? (props.orderId ? "Đang cập nhật..." : "Đang tạo...") : (props.orderId ? "Cập Nhật Đơn Hàng" : "Tạo Đơn Hàng") }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Medicine, Member, SaleItem } from "@/types";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const props = defineProps<{
  orderId?: string;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const loading = ref(false);
const members = ref<Member[]>([]);
const medicines = ref<Medicine[]>([]);
const selectedCustomer = ref<Member | null>(null);
const selectedMedicineId = ref("");
const medicineQuantity = ref(1);
const memberDiscount = ref(0);

const formData = ref({
  customer_id: "",
  staff_id: authStore.user?.id || "",
  items: [] as SaleItem[],
  discount: 0,
});

// Check if medicine is expired
function isExpired(medicine: Medicine): boolean {
  if (!medicine.expiryDate) return false;
  const expiryDate = new Date(medicine.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
}

// Check if medicine is out of stock
function isOutOfStock(medicine: Medicine): boolean {
  return medicine.quantity === 0;
}

// Check if medicine can be selected (not expired and not out of stock)
function isMedicineDisabled(medicine: Medicine): boolean {
  return isExpired(medicine) || isOutOfStock(medicine);
}

// Get medicine status text
function getMedicineStatus(medicine: Medicine): string | null {
  if (isExpired(medicine) && medicine.quantity > 0) {
    return 'Hết hạn';
  }
  if (isOutOfStock(medicine)) {
    return 'Hết hàng';
  }
  return null;
}


const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + item.subtotal, 0);
});

const finalAmount = computed(() => {
  const discount = memberDiscount.value > 0 ? memberDiscount.value : (formData.value.discount || 0);
  return Math.max(0, totalAmount.value - discount);
});

// Member level discount calculation
function calculateMemberDiscount(level: string, total: number): number {
  const discountConfig: Record<string, { percent: number; max: number }> = {
    bronze: { percent: 2, max: 20000 },
    silver: { percent: 5, max: 50000 },
    gold: { percent: 8, max: 100000 },
    platinum: { percent: 12, max: 200000 },
  };

  const config = discountConfig[level];
  if (!config) return 0;

  const discount = (total * config.percent) / 100;
  return Math.min(discount, config.max);
}

function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    bronze: "Đồng",
    silver: "Bạc",
    gold: "Vàng",
    platinum: "Bạch Kim",
  };
  return labels[level] || level;
}

function getDiscountPercent(level: string): number {
  const discountConfig: Record<string, { percent: number }> = {
    bronze: { percent: 2 },
    silver: { percent: 5 },
    gold: { percent: 8 },
    platinum: { percent: 12 },
  };
  return discountConfig[level]?.percent || 0;
}

function getPointsPer10k(level: string): number {
  const pointsConfig: Record<string, number> = {
    bronze: 5,
    silver: 10,
    gold: 15,
    platinum: 20,
  };
  return pointsConfig[level] || 0;
}

function calculatePointsToReceive(level: string, finalAmount: number): number {
  const pointsPer10k = getPointsPer10k(level);
  return Math.floor((finalAmount / 10000) * pointsPer10k);
}

function handleCustomerChange() {
  const customer = members.value.find(m => m.id === formData.value.customer_id);
  selectedCustomer.value = customer || null;

  if (customer && customer.level) {
    memberDiscount.value = calculateMemberDiscount(customer.level, totalAmount.value);
    formData.value.discount = memberDiscount.value;
  } else {
    memberDiscount.value = 0;
    formData.value.discount = 0;
  }
}

async function fetchMembers() {
  try {
    const response = await api.get("/members", { params: { limit: 100 } });
    members.value = response.data.data || [];
  } catch (error) {
    console.error("Error fetching members:", error);
  }
}

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

async function addItem() {
  if (!selectedMedicineId.value || !medicineQuantity.value) return;

  const medicine = medicines.value.find(m => m.id === selectedMedicineId.value);
  if (!medicine) return;

  // Check if already in cart
  const existingIndex = formData.value.items.findIndex(
    item => item.medicineId === selectedMedicineId.value
  );

  if (existingIndex > -1) {
    // Update quantity
    const item = formData.value.items[existingIndex];
    const newQuantity = item.quantity + medicineQuantity.value;
    if (newQuantity > medicine.quantity) {
      const { error } = await import("@/composables/useToast").then(m => m.useToast());
      error(`Số lượng không đủ. Chỉ còn ${medicine.quantity} sản phẩm.`);
      return;
    }
    item.quantity = newQuantity;
    item.subtotal = item.quantity * item.price;

    // Recalculate member discount when items change
    if (selectedCustomer.value && selectedCustomer.value.level) {
      memberDiscount.value = calculateMemberDiscount(selectedCustomer.value.level, totalAmount.value);
      formData.value.discount = memberDiscount.value;
    }
  } else {
    // Add new item
    if (medicineQuantity.value > medicine.quantity) {
      const { error } = await import("@/composables/useToast").then(m => m.useToast());
      error(`Số lượng không đủ. Chỉ còn ${medicine.quantity} sản phẩm.`);
      return;
    }
    formData.value.items.push({
      medicineId: medicine.id,
      medicine: medicine,
      quantity: medicineQuantity.value,
      price: medicine.price,
      subtotal: medicine.price * medicineQuantity.value,
    });

    // Recalculate member discount when items change
    if (selectedCustomer.value && selectedCustomer.value.level) {
      memberDiscount.value = calculateMemberDiscount(selectedCustomer.value.level, totalAmount.value);
      formData.value.discount = memberDiscount.value;
    }
  }

  selectedMedicineId.value = "";
  medicineQuantity.value = 1;
}

function removeItem(index: number) {
  formData.value.items.splice(index, 1);

  // Recalculate member discount when items change
  if (selectedCustomer.value && selectedCustomer.value.level) {
    memberDiscount.value = calculateMemberDiscount(selectedCustomer.value.level, totalAmount.value);
    formData.value.discount = memberDiscount.value;
  }
}

async function handleSubmit() {
  if (formData.value.items.length === 0) {
    const { error } = await import("@/composables/useToast").then(m => m.useToast());
    error("Vui lòng thêm ít nhất một sản phẩm vào đơn hàng");
    return;
  }

  loading.value = true;
  try {
    const payload = {
      customer_id: formData.value.customer_id || null,
      staff_id: authStore.user?.id,
      items: formData.value.items.map(item => ({
        medicine_id: item.medicineId,
        quantity: item.quantity,
        price: item.price,
      })),
      discount: formData.value.discount || 0,
    };

    if (props.orderId) {
      // Update existing order
      await api.put(`/sales/${props.orderId}`, payload);
      const { success } = await import("@/composables/useToast").then(m => m.useToast());
      success("Đơn hàng đã được cập nhật thành công!");
    } else {
      // Create new order
      await api.post("/sales", payload);
      const { success } = await import("@/composables/useToast").then(m => m.useToast());
      success("Đơn hàng đã được tạo thành công!");
    }
    emit("success");
  } catch (error: any) {
    console.error(props.orderId ? "Error updating order:" : "Error creating order:", error);
    const { error: showError } = await import("@/composables/useToast").then(m => m.useToast());
    showError(error.response?.data?.error || (props.orderId ? "Lỗi khi cập nhật đơn hàng" : "Lỗi khi tạo đơn hàng"));
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

async function loadOrderData() {
  if (!props.orderId) return;

  try {
    loading.value = true;
    const response = await api.get(`/sales/${props.orderId}`);
    const order = response.data;

    // Load customer
    formData.value.customer_id = order.customer_id || "";
    
    // Load order items first
    formData.value.items = [];
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        // Fetch medicine details
        const medicine = medicines.value.find(m => m.id === item.medicine_id);
        if (medicine) {
          formData.value.items.push({
            medicineId: item.medicine_id,
            medicine: medicine,
            quantity: item.quantity,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal),
          });
        }
      }
    }

    // Load customer info and calculate discount after items are loaded
    if (order.customer_id) {
      const customer = members.value.find(m => m.id === order.customer_id);
      selectedCustomer.value = customer || null;
      
      if (customer && customer.level) {
        memberDiscount.value = calculateMemberDiscount(customer.level, totalAmount.value);
        formData.value.discount = memberDiscount.value;
      } else {
        // If no member discount, use the discount from order
        formData.value.discount = parseFloat(order.discount) || 0;
        memberDiscount.value = 0;
      }
    } else {
      // Load discount for non-member orders
      formData.value.discount = parseFloat(order.discount) || 0;
      memberDiscount.value = 0;
    }
  } catch (error: any) {
    console.error("Error loading order data:", error);
    const { error: showError } = await import("@/composables/useToast").then(m => m.useToast());
    showError(error.response?.data?.error || "Lỗi khi tải dữ liệu đơn hàng");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchMembers();
  await fetchMedicines();
  await loadOrderData();
});
</script>
