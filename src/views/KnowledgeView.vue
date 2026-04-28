<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { TYPE_CONFIG } from '@/types/knowledge'
import type { KnowledgeFilter } from '@/types/knowledge'

const store = useKnowledgeStore()

const isGraphView = ref(false)
const searchQuery = ref('')
const activeFilter = ref<KnowledgeFilter>('all')

const filterOptions: { label: string; value: KnowledgeFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '概念', value: 'concept' },
  { label: '笔记', value: 'note' },
  { label: '文档', value: 'document' },
]

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return store.items.filter((item) => {
    const matchType = activeFilter.value === 'all' || item.type === activeFilter.value
    if (!q) return matchType
    const matchText =
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      item.topic.toLowerCase().includes(q)
    return matchType && matchText
  })
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 30) return `${diff}天前`
  if (diff < 365) return `${Math.floor(diff / 30)}个月前`
  return `${Math.floor(diff / 365)}年前`
}

function topicIcon(topic: string) {
  if (topic === '计算机网络') return '🌐'
  if (topic === '机器学习') return '🤖'
  if (topic === '产品经理') return '📋'
  return '📚'
}
</script>

<template>
  <div class="kv-root">
    <div class="kv-title-row">
      <div class="kv-title-left">
        <span class="kv-icon">💡</span>
        <div>
          <h1 class="kv-title">知识库</h1>
          <p class="kv-sub">
            {{ store.stats.total }} 条知识 ·
            <span v-if="store.stats.conflicts > 0" class="conflict-chip">
              ⚠ {{ store.stats.conflicts }} 处冲突待确认
            </span>
          </p>
        </div>
      </div>
      <button class="view-toggle" @click="isGraphView = !isGraphView">
        <span v-if="isGraphView">📋 列表视图</span>
        <span v-else>🔗 图谱视图</span>
      </button>
    </div>

    <div v-if="!isGraphView" class="kv-search-bar glass-light">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" class="search-input" placeholder="搜索标题、摘要、标签…" type="text" />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">×</button>
      </div>
      <div class="filter-row">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="filter-btn"
          :class="{ active: activeFilter === opt.value }"
          @click="activeFilter = opt.value"
        >
          {{ opt.label }}
          <span class="filter-count">{{ opt.value === 'all' ? store.stats.total : store.stats[opt.value] }}</span>
        </button>
      </div>
    </div>

    <div class="kv-body">
      <div v-if="!isGraphView" class="kv-list">
        <div class="result-info" v-if="searchQuery || activeFilter !== 'all'">
          找到 <strong>{{ filteredItems.length }}</strong> 条结果
          <span v-if="searchQuery"> · 关键词"{{ searchQuery }}"</span>
          <button class="clear-btn" @click="searchQuery = ''; activeFilter = 'all'">清除筛选</button>
        </div>

        <div v-if="filteredItems.length > 0" class="cards-grid">
          <article
            v-for="(item, idx) in filteredItems"
            :key="item.id"
            class="k-card glass-light"
            :class="{ 'has-conflict': item.hasConflict }"
            :style="{ animationDelay: `${idx * 35}ms` }"
          >
            <div class="card-meta">
              <span
                class="type-badge"
                :style="{ color: TYPE_CONFIG[item.type].color, background: TYPE_CONFIG[item.type].bg, borderColor: TYPE_CONFIG[item.type].borderColor }"
              >{{ TYPE_CONFIG[item.type].label }}</span>
              <span v-if="item.type === 'document' && item.title.includes('课件')" class="markitdown-tag">📄 MarkItDown</span>
              <span class="topic-badge">{{ topicIcon(item.topic) }} {{ item.topic }}</span>
              <span v-if="item.hasConflict" class="conflict-badge">⚠ 冲突</span>
              <span class="card-date">{{ formatDate(item.updatedAt) }}</span>
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-summary">{{ item.summary.slice(0, 100) }}…</p>
            <div class="card-tags">
              <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag-pill">#{{ tag }}</span>
              <span v-if="item.tags.length > 3" class="tag-more">+{{ item.tags.length - 3 }}</span>
            </div>
            <div v-if="item.hasConflict" class="conflict-bar">
              <span class="cb-icon">⚠</span>
              <span class="cb-text">{{ item.conflictDesc?.slice(0, 60) }}…</span>
              <button class="cb-action">查看详情</button>
            </div>
          </article>
        </div>

        <div v-else class="empty-state glass-light">
          <div class="es-emoji">🔍</div>
          <p class="es-text">未找到相关知识条目</p>
          <p class="es-sub">尝试更换关键词或筛选条件</p>
          <button class="es-btn" @click="searchQuery = ''; activeFilter = 'all'">重置搜索</button>
        </div>
      </div>

      <div v-else class="kv-graph">
        <div class="graph-hint">
          <span>💡</span> 拖拽节点调整布局 · 滚轮缩放 · 点击 <span class="hint-conflict">红色节点</span> 查看冲突详情
        </div>
        <div class="graph-canvas-wrap">
          <KnowledgeGraph :nodes="store.graphNodes" :edges="store.graphEdges" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kv-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 28px 32px;
  gap: 20px;
  overflow: hidden;
  font-family: 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
}

.kv-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.kv-title-left { display: flex; align-items: center; gap: 14px; }
.kv-icon { font-size: 32px; line-height: 1; }
.kv-title { margin: 0; font-size: 24px; font-weight: 700; color: #3D3631; letter-spacing: -0.5px; }
.kv-sub { margin: 3px 0 0; font-size: 13px; color: #8B7E74; }
.conflict-chip {
  color: #E8890A;
  background: rgba(255, 175, 40, 0.1);
  border: 1px solid rgba(240, 150, 20, 0.35);
  border-radius: 20px;
  padding: 1px 9px;
  font-size: 11.5px;
  font-weight: 600;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 12px;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.7);
  backdrop-filter: blur(14px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  color: #3D3631;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.22s ease;
}
.view-toggle:hover { background: rgba(255,255,255,0.78); transform: translateY(-1px); }

.kv-search-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 18px;
  border-radius: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 10px;
  padding: 8px 12px;
}
.search-icon { color: #8B7E74; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: #3D3631; font-family: inherit; }
.search-input::placeholder { color: rgba(139,126,116,0.5); }
.search-clear { background: none; border: none; cursor: pointer; color: #8B7E74; font-size: 17px; }

.filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.5);
  color: #8B7E74; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 0.18s; font-weight: 500;
}
.filter-btn:hover { background: rgba(255,255,255,0.8); color: #3D3631; }
.filter-btn.active { background: #7B9EC4; border-color: #7B9EC4; color: #fff; }
.filter-count { font-size: 11px; opacity: 0.75; }

.kv-body { flex: 1; overflow: hidden; }
.kv-list { height: 100%; overflow-y: auto; padding-right: 4px; }
.kv-list::-webkit-scrollbar { width: 5px; }
.kv-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }

.result-info { font-size: 13px; color: #8B7E74; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.result-info strong { color: #3D3631; }
.clear-btn { background: none; border: none; color: #7B9EC4; font-size: 13px; cursor: pointer; text-decoration: underline; }

.cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding-bottom: 24px; }
@media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) { .cards-grid { grid-template-columns: 1fr; } }

.k-card {
  position: relative; border-radius: 16px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px;
  cursor: pointer; transition: transform 0.22s ease, box-shadow 0.22s ease;
  overflow: hidden; animation: card-in 0.4s ease both;
}
@keyframes card-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.k-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
.k-card.has-conflict { border-color: rgba(240, 150, 20, 0.35); background: rgba(255, 248, 230, 0.65); }
.k-card.has-conflict::after {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, #FFC234, #FF8C00); border-radius: 16px 0 0 16px;
}

.card-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.type-badge { font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 6px; border: 1px solid transparent; }

.markitdown-tag {
  font-size: 10px; font-weight: 600; color: #6E6259;
  background: rgba(139, 126, 116, 0.1); border: 1px solid rgba(139, 126, 116, 0.2);
  border-radius: 4px; padding: 1px 6px; white-space: nowrap;
}

.topic-badge { font-size: 11px; color: #8B7E74; background: rgba(0,0,0,0.05); border-radius: 6px; padding: 2px 8px; }
.conflict-badge { font-size: 11px; font-weight: 700; color: #E8890A; background: rgba(255, 175, 40, 0.1); border: 1px solid rgba(240, 150, 20, 0.35); border-radius: 6px; padding: 2px 8px; }
.card-date { margin-left: auto; font-size: 11px; color: #8B7E74; white-space: nowrap; }

.card-title { margin: 0; font-size: 15.5px; font-weight: 700; color: #3D3631; line-height: 1.35; }
.card-summary { margin: 0; font-size: 12.5px; color: #8B7E74; line-height: 1.7; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-pill { font-size: 11px; color: #7B9EC4; background: rgba(123,158,196,0.12); border: 1px solid rgba(123,158,196,0.22); border-radius: 6px; padding: 2px 8px; }
.tag-more { font-size: 11px; color: #8B7E74; padding: 2px 6px; }

.conflict-bar { display: flex; align-items: center; gap: 8px; background: rgba(255,175,40,0.12); border: 1px solid rgba(240,150,20,0.35); border-radius: 8px; padding: 7px 10px; }
.cb-icon { font-size: 13px; color: #E8890A; }
.cb-text { font-size: 11.5px; color: #7A5200; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cb-action { background: rgba(240,150,20,0.18); border: 1px solid rgba(200,120,0,0.3); border-radius: 5px; padding: 3px 10px; font-size: 11px; color: #7A5200; cursor: pointer; white-space: nowrap; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 32px; border-radius: 20px; text-align: center; gap: 10px; }
.es-emoji { font-size: 48px; }
.es-text { margin: 0; font-size: 16px; font-weight: 600; color: #3D3631; }
.es-sub { margin: 0; font-size: 13px; color: #8B7E74; }
.es-btn { margin-top: 8px; padding: 8px 20px; border-radius: 10px; background: #7B9EC4; border: none; color: #fff; font-size: 13px; cursor: pointer; }

.kv-graph { height: 100%; display: flex; flex-direction: column; gap: 12px; }
.graph-hint { flex-shrink: 0; font-size: 12.5px; color: #8B7E74; background: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.65); border-radius: 10px; padding: 8px 16px; backdrop-filter: blur(12px); display: flex; align-items: center; gap: 8px; }
.hint-conflict { color: #D04040; font-weight: 600; }
.graph-canvas-wrap { flex: 1; min-height: 0; border-radius: 18px; overflow: hidden; }
</style>