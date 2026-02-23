<template>
  <div class="animate-pulse">
    <div v-if="type === 'table'" class="space-y-4">
      <div v-for="i in rows" :key="i" class="flex gap-4">
        <div v-for="j in columns" :key="j" class="flex-1">
          <div class="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    
    <div v-else-if="type === 'card'" class="space-y-4">
      <div class="h-8 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded"></div>
      <div class="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    
    <div v-else-if="type === 'stats'" class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div v-for="i in count" :key="i" class="card">
        <div class="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div class="h-10 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    <div v-else class="space-y-4">
      <div class="h-4 bg-gray-200 rounded w-full"></div>
      <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      <div class="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'table' | 'card' | 'stats' | 'default';
  rows?: number;
  columns?: number;
  count?: number;
}>();
</script>

