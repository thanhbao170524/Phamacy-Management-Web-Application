<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center" @click="$emit('close')">
      <div class="bg-white rounded-t-2xl w-full max-w-md h-[600px] flex flex-col shadow-2xl" @click.stop>
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">AI Trợ Lý Chat</h3>
          <button
            @click="$emit('close')"
            class="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-for="message in messages" :key="message.id" class="flex" :class="{ 'justify-end': message.sender === 'user' }">
            <div class="max-w-[80%] rounded-lg p-3" :class="message.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'">
              <p class="text-sm">{{ message.text }}</p>
              <span class="text-xs opacity-70">{{ message.time }}</span>
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-200 p-4">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" class="btn-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  time: string
}

const messages = ref<Message[]>([
  {
    id: 1,
    text: 'Xin chào! Tôi là AI trợ lý của bạn. Tôi có thể giúp gì cho bạn?',
    sender: 'ai',
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }
])

const newMessage = ref('')

function sendMessage() {
  if (!newMessage.value.trim()) return

  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  
  // Add user message
  messages.value.push({
    id: Date.now(),
    text: newMessage.value,
    sender: 'user',
    time: now
  })

  // Add AI response (mock)
  setTimeout(() => {
    messages.value.push({
      id: Date.now() + 1,
      text: 'Tôi đang xử lý yêu cầu của bạn...',
      sender: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    })
  }, 1000)

  newMessage.value = ''
}

defineEmits(['close'])
</script>

