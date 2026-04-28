<template>
  <div class="tasks-view">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title"><span class="title-icon">📋</span>任务看板</h1>
        <p class="page-subtitle">用 AI 拆解复杂任务，掌控每一个截止日</p>
      </div>
      <div class="header-right">
        <button class="create-btn" @click="openCreateDialog">＋ 新建任务</button>
      </div>
    </header>

    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.status"
        class="kanban-column"
        :style="{ '--col-accent': col.accent }"
        @dragover.prevent="dragOverCol = col.status"
        @dragleave="dragOverCol = ''"
        @drop.prevent="onDrop(col.status)"
        :class="{ 'drag-over': dragOverCol === col.status }"
      >
        <div class="column-header">
          <div class="col-header-left">
            <span class="col-icon">{{ col.icon }}</span>
            <span class="col-title">{{ col.title }}</span>
          </div>
          <span class="col-count">{{ col.tasks.length }}</span>
        </div>
        <div class="col-accent-line"></div>

        <div class="column-body">
          <div v-if="col.tasks.length === 0" class="empty-col">
            <span class="empty-icon">🗂️</span>
            <span>暂无任务</span>
          </div>

          <div
            v-for="task in col.tasks"
            :key="task.id"
            class="kanban-card"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
          >
            <div class="card-top">
              <span class="priority-dot" :class="'priority-' + task.priority"></span>
              <span class="card-title">{{ task.title }}</span>
            </div>

            <div v-if="task.sourceLabel" class="card-tags">
              <span class="source-tag" :class="task.source === 'qq-group' ? 'tag-qq' : 'tag-generic'">
                {{ task.sourceLabel }}
              </span>
            </div>

            <div v-if="task.deadline" class="deadline-chip" :class="deadlineClass(task.deadline)">
              <span class="deadline-icon">{{ isOverdue(task.deadline) ? '⚠️' : '⏰' }}</span>
              <span>{{ deadlineText(task.deadline) }}</span>
            </div>

            <div v-if="task.subTasks.length > 0" class="card-progress">
              <div class="progress-header">
                <span class="progress-label">子任务</span>
                <span class="progress-count">{{ completedCount(task) }}/{{ task.subTasks.length }}</span>
              </div>
              <div class="progress-bar-track">
                <div
                  class="progress-bar-fill"
                  :class="{ complete: completedCount(task) === task.subTasks.length }"
                  :style="{ width: progressPercent(task) + '%' }"
                ></div>
              </div>
              <div class="subtask-list">
                <div
                  v-for="sub in task.subTasks.slice(0, 3)"
                  :key="sub.id"
                  class="subtask-row"
                  :class="{ completed: sub.completed }"
                  @click="toggleSub(task.id, sub.id)"
                >
                  <span class="subtask-check">{{ sub.completed ? '✓' : '○' }}</span>
                  <span class="subtask-label">{{ sub.text }}</span>
                </div>
              </div>
              <span v-if="task.subTasks.length > 3" class="more-tasks">+{{ task.subTasks.length - 3 }} 项</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建任务对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog-box">
        <h3 class="dialog-title">新建任务</h3>

        <div class="form-field">
          <label class="field-label">任务标题 <span class="required">*</span></label>
          <input v-model="form.title" class="native-input" placeholder="请输入任务标题…" maxlength="60" />
        </div>

        <div class="form-field">
          <label class="field-label">截止日期</label>
          <input v-model="form.deadline" type="date" class="native-input" />
        </div>

        <div class="form-field">
          <label class="field-label">优先级</label>
          <div class="priority-options">
            <label class="priority-opt" :class="{ selected: form.priority === 'low' }">
              <input type="radio" value="low" v-model="form.priority" /> 🟢 低
            </label>
            <label class="priority-opt" :class="{ selected: form.priority === 'medium' }">
              <input type="radio" value="medium" v-model="form.priority" /> 🟡 中
            </label>
            <label class="priority-opt" :class="{ selected: form.priority === 'high' }">
              <input type="radio" value="high" v-model="form.priority" /> 🔴 高
            </label>
          </div>
        </div>
<div class="form-field ai-section">
          <div class="ai-header">
            <label class="field-label">AI 子任务拆解</label>
            <button class="ai-btn" :disabled="!form.title.trim() || aiLoading" @click="handleAIDecompose">
              <span class="ai-icon">✨</span> {{ aiLoading ? '拆解中…' : 'AI 拆解' }}
            </button>
          </div>

          <!-- Loading 动画 -->
          <div v-if="aiLoading" class="ai-loading-box">
            <div class="ai-loading-step" :class="{ active: aiStep >= 1, done: aiStep > 1 }">
              <span class="step-dot">{{ aiStep > 1 ? '✓' : aiStep === 1 ? '●' : '○' }}</span>
              <span class="step-text">正在分析任务类型和关键词…</span>
            </div>
            <div class="ai-loading-step" :class="{ active: aiStep >= 2, done: aiStep > 2 }">
              <span class="step-dot">{{ aiStep > 2 ? '✓' : aiStep === 2 ? '●' : '○' }}</span>
              <span class="step-text">检索知识库中相关参考资料…</span>
            </div>
            <div class="ai-loading-step" :class="{ active: aiStep >= 3, done: aiStep > 3 }">
              <span class="step-dot">{{ aiStep > 3 ? '✓' : aiStep === 3 ? '●' : '○' }}</span>
              <span class="step-text">生成可执行的子任务步骤…</span>
            </div>
          </div>

          <!-- 生成结果 -->
          <div v-if="generatedSubTasks.length > 0 && !aiLoading" class="subtask-result">
            <div v-for="(sub, idx) in generatedSubTasks" :key="sub.id" class="subtask-item">
              <span class="subtask-dot">○</span>
              <span class="subtask-text">{{ sub.text }}</span>
            </div>
          </div>

          <p v-if="!form.title.trim()" class="ai-hint">请先填写标题再进行 AI 拆解</p>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="dialogVisible = false">取消</button>
          <button class="btn-confirm" :disabled="!form.title.trim()" @click="handleCreateTask">创建任务</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskStatus } from '@/types/task'

const taskStore = useTaskStore()

const columns = computed(() => [
  { status: 'todo' as TaskStatus, title: '待办', icon: '📌', tasks: taskStore.todoTasks, accent: '#7c9eb5' },
  { status: 'in-progress' as TaskStatus, title: '进行中', icon: '⚡', tasks: taskStore.inProgressTasks, accent: '#a89cc8' },
  { status: 'done' as TaskStatus, title: '已完成', icon: '✅', tasks: taskStore.doneTasks, accent: '#8fb89a' },
])

const dialogVisible = ref(false)
const dragOverCol = ref('')
const aiLoading = ref(false)
const aiStep = ref(0)
const generatedSubTasks = ref<any[]>([])

const form = reactive({
  title: '',
  deadline: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
})

function openCreateDialog() { dialogVisible.value = true }
function handleAIDecompose() {
  if (!form.title.trim()) return
  aiLoading.value = true
  aiStep.value = 0
  generatedSubTasks.value = []
  setTimeout(() => { aiStep.value = 1 }, 300)
  setTimeout(() => { aiStep.value = 2 }, 1000)
  setTimeout(() => { aiStep.value = 3 }, 1700)
  setTimeout(() => {
    generatedSubTasks.value = taskStore.generateAISubTasks()
    aiLoading.value = false
    aiStep.value = 0
  }, 2300)
}
function handleCreateTask() {
  if (!form.title.trim()) return
  const newTask = taskStore.addTask({ title: form.title.trim(), deadline: form.deadline, priority: form.priority })
  if (generatedSubTasks.value.length > 0) {
    taskStore.setSubTasks(newTask.id, [...generatedSubTasks.value])
  }
  dialogVisible.value = false
  form.title = ''
  form.deadline = ''
  form.priority = 'medium'
  generatedSubTasks.value = []
}

function onDragStart(e: DragEvent, taskId: string) {
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', taskId)
}

function onDrop(newStatus: TaskStatus) {
  const taskId = e.dataTransfer?.getData('text/plain')
  if (taskId) {
    taskStore.moveTask(taskId, newStatus)
    dragOverCol.value = ''
  }
}

function toggleSub(taskId: string, subId: string) {
  taskStore.toggleSubTask(taskId, subId)
}

// 辅助函数
function daysRemaining(deadline: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(deadline); d.setHours(0,0,0,0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}
function isOverdue(deadline: string): boolean { return daysRemaining(deadline) < 0 }
function deadlineText(deadline: string): string {
  const d = daysRemaining(deadline)
  if (d < 0) return `已逾期 ${Math.abs(d)} 天`
  if (d === 0) return '今天截止'
  return `剩余 ${d} 天`
}
function deadlineClass(deadline: string): string {
  const d = daysRemaining(deadline)
  if (d < 0) return 'overdue'
  if (d <= 2) return 'urgent'
  return ''
}
function completedCount(task: any): number {
  return task.subTasks.filter((s: any) => s.completed).length
}
function progressPercent(task: any): number {
  if (task.subTasks.length === 0) return 0
  return Math.round((completedCount(task) / task.subTasks.length) * 100)
}
</script>

<style scoped>
.tasks-view {
  padding: 28px 32px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-family: 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
}

.page-header { display: flex; align-items: flex-end; justify-content: space-between; }
.page-title { font-size: 1.6rem; font-weight: 700; color: #3D3631; display: flex; align-items: center; gap: 10px; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #8B7E74; margin: 4px 0 0; }
.create-btn { background: linear-gradient(135deg, #7c9eb5, #a89cc8); border: none; border-radius: 12px; padding: 10px 20px; font-size: 0.9rem; font-weight: 600; color: #fff; cursor: pointer; box-shadow: 0 4px 14px rgba(124,158,181,0.35); transition: transform 0.2s, box-shadow 0.2s; }
.create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,158,181,0.45); }

.kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; flex: 1; align-items: start; }

.kanban-column { background: rgba(255,255,255,0.45); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.65); border-radius: 20px; padding: 18px 16px 20px; display: flex; flex-direction: column; box-shadow: 0 4px 24px rgba(120,130,160,0.08); min-height: 400px; transition: background 0.25s; }
.kanban-column.drag-over { background: rgba(255,255,255,0.62); box-shadow: 0 0 0 2px var(--col-accent); }

.column-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.col-header-left { display: flex; align-items: center; gap: 8px; }
.col-icon { font-size: 1.1rem; }
.col-title { font-size: 0.95rem; font-weight: 700; color: #3D3631; }
.col-count { background: var(--col-accent); color: white; font-size: 0.72rem; font-weight: 700; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.col-accent-line { height: 3px; background: linear-gradient(90deg, var(--col-accent), transparent); border-radius: 4px; margin-bottom: 14px; opacity: 0.7; }

.column-body { display: flex; flex-direction: column; gap: 12px; }
.empty-col { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 0; color: #8B7E74; font-size: 0.82rem; opacity: 0.6; }

.kanban-card { background: rgba(255,255,255,0.72); border: 1px solid rgba(255,255,255,0.8); border-radius: 14px; padding: 14px 14px 12px; cursor: grab; transition: transform 0.18s, box-shadow 0.18s; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 10px rgba(100,120,150,0.07); }
.kanban-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(100,120,150,0.14); }

.card-top { display: flex; align-items: flex-start; gap: 8px; }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.priority-dot.priority-high { background: #e07373; }
.priority-dot.priority-medium { background: #d4aa5a; }
.priority-dot.priority-low { background: #8fb89a; }

.card-title { font-size: 0.88rem; font-weight: 600; color: #3D3631; line-height: 1.45; flex: 1; }

.source-tag { padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.source-tag.tag-qq { background: rgba(60,130,210,0.15); color: #3c82d2; border: 1px solid rgba(60,130,210,0.3); }
.source-tag.tag-generic { background: rgba(130,130,160,0.1); color: #7a7aa8; border: 1px solid rgba(130,130,160,0.2); }

.deadline-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; background: rgba(140,160,180,0.1); color: #8B7E74; align-self: flex-start; }
.deadline-chip.urgent { background: rgba(224,115,115,0.1); color: #c05858; }
.deadline-chip.overdue { background: rgba(200,80,80,0.12); color: #b04040; }

.card-progress { display: flex; flex-direction: column; gap: 5px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.73rem; }
.progress-bar-track { height: 4px; background: rgba(140,160,180,0.18); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #7c9eb5, #a89cc8); border-radius: 4px; transition: width 0.4s; }
.progress-bar-fill.complete { background: linear-gradient(90deg, #8fb89a, #6aaa7e); }

.subtask-list { display: flex; flex-direction: column; gap: 3px; margin-top: 2px; }
.subtask-row { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 2px 4px; border-radius: 6px; transition: background 0.15s; }
.subtask-row:hover { background: rgba(120,140,180,0.08); }
.subtask-check { font-size: 0.72rem; width: 14px; color: #8B7E74; }
.subtask-row.completed .subtask-check { color: #6aaa7e; }
.subtask-label { font-size: 0.76rem; color: #8B7E74; }
.subtask-row.completed .subtask-label { text-decoration: line-through; opacity: 0.55; }
.more-tasks { font-size: 0.72rem; color: #8B7E74; opacity: 0.6; }

/* 对话框样式 */
.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.dialog-box { width: 460px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.dialog-title { margin: 0 0 20px; font-size: 1.1rem; font-weight: 700; color: #3D3631; }
.form-field { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.85rem; font-weight: 600; color: #3D3631; }
.required { color: #e07373; }
.native-input { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(139,126,116,0.25); background: rgba(255,255,255,0.7); font-size: 14px; color: #3D3631; outline: none; font-family: inherit; }
.native-input:focus { border-color: rgba(139,126,116,0.5); }
.priority-options { display: flex; gap: 8px; }
.priority-opt { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(139,126,116,0.2); cursor: pointer; font-size: 0.82rem; transition: background 0.2s; }
.priority-opt.selected { background: rgba(139,126,116,0.1); border-color: rgba(139,126,116,0.4); }
.dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(139,126,116,0.15); }
.btn-cancel { padding: 8px 20px; border-radius: 10px; border: 1px solid rgba(139,126,116,0.25); background: transparent; color: #8B7E74; cursor: pointer; font-size: 0.9rem; }
.btn-confirm { padding: 8px 20px; border-radius: 10px; border: none; background: #8B7E74; color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 600; }
.btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
/* AI 拆解模块 */
.ai-section {
  background: rgba(168,156,200,0.07);
  border: 1px dashed rgba(168,156,200,0.35);
  border-radius: 14px;
  padding: 14px;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-btn {
  background: rgba(168,156,200,0.2);
  border: 1px solid rgba(168,156,200,0.3);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  color: #3D3631;
  transition: background 0.2s;
}

.ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-btn:hover:not(:disabled) {
  background: rgba(168,156,200,0.35);
}

.ai-loading-box {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-loading-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: #B5A99F;
  transition: color 0.3s;
}

.ai-loading-step.active { color: #8B7E74; font-weight: 500; }
.ai-loading-step.done { color: #7D9B76; }

.step-dot { font-size: 10px; width: 16px; text-align: center; }
.step-text { flex: 1; }

.subtask-result {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.65);
  border-radius: 8px;
  font-size: 0.82rem;
  color: #3D3631;
}

.subtask-dot { color: #a89cc8; flex-shrink: 0; }
.subtask-text { color: #3D3631; }

.ai-hint {
  font-size: 0.76rem;
  color: #8B7E74;
  font-style: italic;
  margin: 8px 0 0;
}
</style>