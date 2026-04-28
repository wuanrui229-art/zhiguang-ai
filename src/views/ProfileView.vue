<template>
  <div class="profile-view">
    <!-- 用户头像区 -->
    <div class="profile-header">
      <div class="avatar-wrap">
        <span class="avatar-emoji">👩‍🎓</span>
        <button class="avatar-edit-btn" title="更换头像">📷</button>
      </div>
      <h2 class="profile-name">同学你好</h2>
      <p class="profile-school">软件工程 · 大三</p>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-row">
      <div class="stat-card glass-light">
        <span class="stat-icon">📚</span>
        <span class="stat-num">{{ knowledgeCount }}</span>
        <span class="stat-label">知识条目</span>
      </div>
      <div class="stat-card glass-light">
        <span class="stat-icon">📋</span>
        <span class="stat-num">{{ taskCount }}</span>
        <span class="stat-label">待办任务</span>
      </div>
      <div class="stat-card glass-light">
        <span class="stat-icon">⚠️</span>
        <span class="stat-num">{{ conflictCount }}</span>
        <span class="stat-label">冲突待确认</span>
      </div>
      <div class="stat-card glass-light">
        <span class="stat-icon">🔥</span>
        <span class="stat-num">{{ streakDays }}</span>
        <span class="stat-label">连续签到</span>
      </div>
    </div>

    <!-- 皮肤切换 -->
    <div class="section">
      <h3 class="section-title">🎨 主题皮肤</h3>
      <div class="skin-row">
        <div
          v-for="skin in skins"
          :key="skin.name"
          class="skin-item"
          :class="{ active: currentSkin === skin.name }"
          :style="{ background: skin.bg, color: skin.color }"
          @click="switchSkin(skin.name)"
        >
          <span class="skin-dot" :style="{ background: skin.dot }"></span>
          <span class="skin-name">{{ skin.label }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <h3 class="section-title">⚙️ 管理</h3>
      <div class="action-list">
        <button class="action-item glass-light" @click="resetDemo">
          <span>🔄 重置演示数据</span>
          <span class="action-arrow">→</span>
        </button>
        <button class="action-item glass-light" @click="clearMessages">
          <span>🗑️ 清空对话记录</span>
          <span class="action-arrow">→</span>
        </button>
      </div>
    </div>

    <!-- 技术栈标签 -->
    <div class="tech-tags">
      <span class="tech-tag">Vue 3</span>
      <span class="tech-tag">TypeScript</span>
      <span class="tech-tag">腾讯混元大模型</span>
      <span class="tech-tag">MarkItDown</span>
      <span class="tech-tag">知识图谱</span>
      <span class="tech-tag">RAG</span>
    </div>

    <p class="version-text">织光AI SmartBoard · V3.0 · 2026</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useTaskStore } from '@/stores/task'
import { useChatStore } from '@/stores/chat'

const knowledgeStore = useKnowledgeStore()
const taskStore = useTaskStore()
const chatStore = useChatStore()

const knowledgeCount = computed(() => knowledgeStore.items.length)
const taskCount = computed(() => taskStore.todoTasks.length)
const conflictCount = computed(() => knowledgeStore.items.filter(i => i.hasConflict).length)
const streakDays = ref(7)

const currentSkin = ref('晨雾')

const skins = [
  { name: '晨雾', label: '晨雾', bg: '#F5F0EB', color: '#8B7E74', dot: '#8B7E74' },
  { name: '藕荷', label: '藕荷', bg: '#F2EDF2', color: '#9B8EA8', dot: '#9B8EA8' },
  { name: '暮光', label: '暮光', bg: '#F5EFE6', color: '#C4A882', dot: '#C4A882' },
  { name: '青瓷', label: '青瓷', bg: '#EDF1EE', color: '#8BAF8A', dot: '#8BAF8A' },
  { name: '云母', label: '云母', bg: '#F0F1F4', color: '#9EB5C4', dot: '#9EB5C4' },
]

function switchSkin(name: string) {
  currentSkin.value = name
  const skin = skins.find(s => s.name === name)
  if (skin) {
    document.documentElement.style.setProperty('--color-bg', skin.bg)
    document.documentElement.style.setProperty('--color-primary', skin.dot)
    document.documentElement.style.setProperty('--color-text', skin.color)
  }
}

function resetDemo() {
  if (confirm('确定要重置所有演示数据吗？此操作不可恢复。')) {
    localStorage.removeItem('demo_initialized')
    location.reload()
  }
}

function clearMessages() {
  if (confirm('确定要清空对话记录吗？')) {
    chatStore.messages.length = 0
  }
}
</script>

<style scoped>
.profile-view {
  padding: 32px 32px 100px;
  max-width: 540px;
  margin: 0 auto;
  font-family: 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
}

/* 头像区 */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 28px;
}

.avatar-wrap {
  position: relative;
  margin-bottom: 14px;
}

.avatar-emoji {
  font-size: 64px;
  line-height: 1;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: rgba(139,126,116,0.15);
  backdrop-filter: blur(6px);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #3D3631;
  margin: 0 0 4px;
}

.profile-school {
  font-size: 13px;
  color: #8B7E74;
  margin: 0;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  border-radius: 16px;
  text-align: center;
}

.stat-icon { font-size: 22px; }
.stat-num { font-size: 20px; font-weight: 700; color: #3D3631; }
.stat-label { font-size: 11px; color: #8B7E74; }

/* 分区 */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #3D3631;
  margin: 0 0 12px;
}

/* 皮肤切换 */
.skin-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.skin-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
}

.skin-item.active {
  border-color: currentColor;
  transform: scale(1.05);
}

.skin-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 操作列表 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 14px;
  color: #3D3631;
  transition: background 0.2s, transform 0.15s;
}

.action-item:hover {
  background: rgba(255,255,255,0.78);
  transform: translateY(-1px);
}

.action-arrow {
  color: #B5A99F;
  font-size: 15px;
}

/* 技术标签 */
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  justify-content: center;
}

.tech-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(139,126,116,0.08);
  color: #8B7E74;
  border: 1px solid rgba(139,126,116,0.12);
}

.version-text {
  text-align: center;
  font-size: 12px;
  color: #B5A99F;
  margin-top: 20px;
}
</style>