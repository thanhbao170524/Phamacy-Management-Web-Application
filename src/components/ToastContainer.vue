<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      <TransitionGroup name="toast" tag="div">
        <div v-for="toast in toasts" :key="toast.id" :class="[
          'min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in',
          getToastClass(toast.type),
        ]">
          <component :is="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0" />
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button @click="removeToast(toast.id)" class="text-current opacity-70 hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Teleport, TransitionGroup } from "vue";
import { useToast } from "@/composables/useToast";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

const { toasts, removeToast } = useToast();

function getToastClass(type: string): string {
  switch (type) {
    case "success":
      return "bg-green-50 border border-green-200 text-green-800";
    case "error":
      return "bg-red-50 border border-red-200 text-red-800";
    case "warning":
      return "bg-orange-50 border border-orange-200 text-orange-800";
    default:
      return "bg-blue-50 border border-blue-200 text-blue-800";
  }
}

function getIcon(type: string) {
  switch (type) {
    case "success":
      return CheckCircleIcon;
    case "error":
      return XCircleIcon;
    case "warning":
      return ExclamationTriangleIcon;
    default:
      return InformationCircleIcon;
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@keyframes slide-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
