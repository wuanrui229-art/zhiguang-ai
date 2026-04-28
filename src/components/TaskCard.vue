<template>
  <div class="task-card glass-light">
    <div class="task-card__header">
      <span class="task-card__icon">📋</span>
      <span class="task-card__title">{{ card.title }}</span>
      <span class="task-card__deadline">⏰ {{ daysLeft }}天</span>
    </div>
    <div class="task-card__subtasks">
      <div
        v-for="item in card.subtasks"
        :key="item.id"
        class="task-card__subtask"
        :class="{ done: item.completed }"
      >
        <span class="task-card__checkbox" @click="toggle(item)">✔</span>
        <span>{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskCardData } from '@/types/chat'

const props = defineProps<{ card: TaskCardData }>()

const daysLeft = computed(() => {
  const diff = new Date(props.card.deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

function toggle(item: { completed: boolean }) {
  item.completed = !item.completed
}
</script>

<style scoped>
.task-card {
  padding: 14px 16px;
  width: 100%;
}

.task-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.task-card__title {
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.task-card__deadline {
  font-size: 12px;
  color: var(--color-warning);
  font-weight: 500;
}

.task-card__subtasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-card__subtask {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.task-card__subtask.done span:last-child {
  text-decoration: line-through;
  opacity: 0.5;
}

.task-card__checkbox {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.task-card__checkbox:hover {
  border-color: var(--color-primary);
}

.done .task-card__checkbox {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}
</style>