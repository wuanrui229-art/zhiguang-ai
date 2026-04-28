<template>
  <div class="app-container">
    <!-- 主内容区（带页面切换动画） -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <!-- 底部导航栏 -->
    <nav class="tab-bar glass">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: isActive(tab.path) }"
        @click="goTo(tab.path)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useTaskStore } from '@/stores/task'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/chat', icon: '💬', label: '对话' },
  { path: '/knowledge', icon: '📚', label: '知识库' },
  { path: '/tasks', icon: '📋', label: '任务' },
  { path: '/profile', icon: '👤', label: '我的' },
]

function isActive(path: string) {
  return route.path === path
}

function goTo(path: string) {
  router.push(path)
}

// 首次打开时注入演示数据
onMounted(() => {
  const initialized = localStorage.getItem('demo_initialized')
  if (!initialized) {
    localStorage.setItem('demo_initialized', 'true')
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-bg, #F5F0EB);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* 给底部TabBar留空间 */
}

/* 底部导航栏 */
.tab-bar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  z-index: 100;
  box-shadow: 0 4px 24px rgba(139, 126, 116, 0.15);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 64px;
  color: var(--color-text-secondary, #8B7E74);
}

.tab-item.active {
  background: rgba(139, 126, 116, 0.15);
  color: var(--color-primary, #8B7E74);
}

.tab-item:hover:not(.active) {
  background: rgba(139, 126, 116, 0.08);
}

.tab-icon {
  font-size: 20px;
  line-height: 1;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>