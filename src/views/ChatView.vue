<template>
  <div class="chat-page" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="onDrop">
    <Transition name="fade">
      <div v-if="isDragging" class="drag-overlay">
        <div class="drag-overlay__inner">
          <span class="drag-overlay__icon">📎</span>
          <p>松开以上传文件</p>
        </div>
      </div>
    </Transition>

    <div class="chat-container">
      <!-- 顶部标题区 -->
      <header class="chat-header">
        <div class="chat-header__logo">
          <div class="logo-icon-wrap">
            <span class="logo-icon">✦</span>
          </div>
          <h1 class="chat-header__title">织光<span class="chat-header__title-accent">AI</span></h1>
        </div>
        <p class="chat-header__slogan">你的校园知识伙伴</p>
        <div class="chat-header__divider" />
      </header>

      <!-- 欢迎引导卡片（消息为空时显示） -->
      <div v-if="messages.length === 0" class="welcome-prompts">
        <div class="prompt-card" @click="inputText = '【QQ群-计算机网络】张老师：下周三交路由模拟实验报告，三人一组'">
          <div class="prompt-icon-wrap qq">
            <span class="prompt-icon">💬</span>
          </div>
          <div class="prompt-content">
            <span class="prompt-title">从QQ群消息创建任务</span>
            <span class="prompt-desc">转发一条群通知，AI自动提取DDL</span>
          </div>
          <span class="prompt-arrow">→</span>
        </div>
        <div class="prompt-card" @click="inputText = '帮我整理这学期CNN相关的笔记'">
          <div class="prompt-icon-wrap note">
            <span class="prompt-icon">📝</span>
          </div>
          <div class="prompt-content">
            <span class="prompt-title">存一条笔记到知识库</span>
            <span class="prompt-desc">AI自动分类并与已有知识建立关联</span>
          </div>
          <span class="prompt-arrow">→</span>
        </div>
        <div class="prompt-card" @click="store.messages.push({ id: String(Date.now()), role: 'assistant', content: '⚠️ 检测到你的小组成员【张同学】3分钟前更新了腾讯文档「路由模拟实验报告」中「实验数据对比」段落，与你昨天提交的版本存在2处数值冲突。\n\n**冲突点1**：RIP收敛时间（你：30s / 对方：45s）\n**冲突点2**：OSPF区域数量（你：3个 / 对方：5个）\n\n请确认以哪个版本为准，或直接跳转腾讯文档在线协商。', timestamp: Date.now(), isTyping: true })">
          <div class="prompt-icon-wrap conflict">
            <span class="prompt-icon">⚠️</span>
          </div>
          <div class="prompt-content">
            <span class="prompt-title">模拟腾讯文档协作冲突提醒</span>
            <span class="prompt-desc">AI自动检测多人协作中的内容矛盾</span>
          </div>
          <span class="prompt-arrow">→</span>
        </div>
      </div>

      <!-- 消息列表 -->
      <main class="chat-messages" ref="messagesEl">
        <div class="chat-messages__list">
          <div v-for="msg in messages" :key="msg.id" class="msg-item">
            <div v-if="msg.role === 'user'" class="bubble-row bubble-row--user">
              <div class="bubble bubble--user">{{ msg.content }}</div>
            </div>
            <div v-else class="bubble-row bubble-row--ai">
              <div class="ai-avatar">🤖</div>
              <div class="bubble-col">
                <div class="bubble bubble--ai">{{ msg.content }}</div>
                <TaskCard v-if="msg.taskCard && !msg.isTyping" :card="msg.taskCard" class="bubble-task-card" />
              </div>
            </div>
          </div>
        </div>
        <div ref="bottomAnchorEl" />
      </main>

      <!-- 底部输入区 -->
      <footer class="chat-footer">
        <div class="chat-footer__toolbar">
          <button class="btn-qq" @click="injectQQ" :disabled="store.isAiReplying">
            <span class="btn-qq__icon">💬</span><span>QQ转发</span>
          </button>
          <button class="btn-qq" @click="store.messages.push({ id: String(Date.now()), role: 'assistant', content: '⚠️ 检测到你的小组成员【张同学】3分钟前更新了腾讯文档「路由模拟实验报告」中「实验数据对比」段落，与你昨天提交的版本存在2处数值冲突。\n\n**冲突点1**：RIP收敛时间（你：30s / 对方：45s）\n**冲突点2**：OSPF区域数量（你：3个 / 对方：5个）\n\n请确认以哪个版本为准，或直接跳转腾讯文档在线协商。', timestamp: Date.now(), isTyping: true })">
            <span>⚠️ 模拟冲突</span>
          </button>
          <span class="chat-footer__hint">拖拽文件可上传 · Shift+Enter 换行</span>
        </div>
        <div class="chat-input-row">
          <textarea v-model="inputText" class="chat-textarea" placeholder="有什么想问的？" rows="1" :disabled="store.isAiReplying" @keydown="onKeydown" />
          <button class="chat-send-btn" :disabled="!inputText.trim() || store.isAiReplying" @click="send">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M17 10L3 4l3 6-3 6 14-6z" fill="currentColor" /></svg>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import TaskCard from '@/components/TaskCard.vue'

const store = useChatStore()
const { messages } = storeToRefs(store)

const inputText = ref('')
const isDragging = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const bottomAnchorEl = ref<HTMLElement | null>(null)

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await store.sendMessage(text)
  nextTick(() => bottomAnchorEl.value?.scrollIntoView({ behavior: 'smooth' }))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function injectQQ() {
  inputText.value = store.injectQQMessage()
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    store.sendMessage(`📎 ${files[0].name}`)
  }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.chat-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #f0ebe7 0%, #e8e2de 40%, #ede7e3 100%);
  display: flex;
  justify-content: center;
  position: relative;
}

.chat-container {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 16px;
}

/* ── 顶部 Header ───────────────────────────────── */
.chat-header {
  padding: 48px 0 0;
  text-align: center;
  flex-shrink: 0;
}

.chat-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
}

.logo-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(139,126,116,0.15), rgba(139,126,116,0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(139,126,116,0.1) inset;
}

.logo-icon {
  font-size: 24px;
  color: #8B7E74;
  animation: logo-spin 8s linear infinite;
}

@keyframes logo-spin {
  to { transform: rotate(360deg); }
}

.chat-header__title {
  font-size: 32px;
  font-weight: 700;
  color: #3D3631;
  letter-spacing: 0.04em;
  margin: 0;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  line-height: 1;
}

.chat-header__title-accent {
  color: #8B7E74;
}

.chat-header__slogan {
  font-size: 14px;
  color: #B5A99F;
  margin: 0 0 28px;
  letter-spacing: 0.12em;
  text-align: center;
  width: 100%;
}

.chat-header__divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139,126,116,0.2) 30%, rgba(139,126,116,0.2) 70%, transparent);
  margin-bottom: 4px;
}

/* ── 欢迎引导卡片 ─────────────────────────────── */
.welcome-prompts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 0 8px;
}

.prompt-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(139,126,116,0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.prompt-card:hover {
  background: rgba(255,255,255,0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(139,126,116,0.12);
  border-color: rgba(139,126,116,0.25);
}

.prompt-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prompt-icon-wrap.qq { background: rgba(60,130,210,0.1); }
.prompt-icon-wrap.note { background: rgba(139,175,138,0.12); }
.prompt-icon-wrap.conflict { background: rgba(232,137,10,0.1); }

.prompt-icon { font-size: 22px; }

.prompt-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.prompt-title {
  font-size: 14px;
  font-weight: 600;
  color: #3D3631;
  letter-spacing: 0.02em;
}

.prompt-desc {
  font-size: 12px;
  color: #B5A99F;
}

.prompt-arrow {
  font-size: 16px;
  color: #C4B5AC;
  transition: transform 0.2s, color 0.2s;
}

.prompt-card:hover .prompt-arrow {
  transform: translateX(3px);
  color: #8B7E74;
}

/* ── 消息区 ────────────────────────────────────── */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.chat-messages__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.bubble-row--user { justify-content: flex-end; }
.bubble-row--ai { justify-content: flex-start; }

.ai-avatar {
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  flex-shrink: 0;
}

.bubble-col {
  max-width: calc(100% - 50px);
}

.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14.5px;
  line-height: 1.65;
  word-break: break-word;
}

.bubble--user {
  background: #8B7E74;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble--ai {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(139,126,116,0.18);
  color: #3D3631;
  border-bottom-left-radius: 4px;
}

.bubble-task-card { margin-top: 8px; }

/* ── 底部输入区 ────────────────────────────────── */
.chat-footer {
  flex-shrink: 0;
  padding: 10px 0 24px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, rgba(240,235,231,0.95) 60%, transparent);
}

.chat-footer__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.chat-footer__hint {
  font-size: 11px;
  color: rgba(122,109,104,0.55);
  margin-left: auto;
}

.btn-qq {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: #8B7E74;
  background: rgba(139,126,116,0.1);
  border: 1px solid rgba(139,126,116,0.22);
  border-radius: 20px;
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-qq:hover { background: rgba(139,126,116,0.18); }

.chat-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-textarea {
  flex: 1;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(139,126,116,0.25);
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 14px;
  color: #3D3631;
  resize: none;
  outline: none;
  font-family: inherit;
}

.chat-textarea:focus {
  border-color: rgba(139,126,116,0.5);
  box-shadow: 0 0 0 3px rgba(139,126,116,0.1);
}

.chat-send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #8B7E74;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── 拖拽遮罩 ──────────────────────────────────── */
.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(240,235,231,0.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-overlay__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 2px dashed rgba(139,126,116,0.45);
  border-radius: 20px;
  padding: 48px 64px;
}

.drag-overlay__icon { font-size: 48px; }

.drag-overlay__inner p {
  font-size: 16px;
  color: #8B7E74;
  font-weight: 500;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>