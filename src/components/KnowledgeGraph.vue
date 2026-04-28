<script setup lang="ts">
import { ref, shallowRef, triggerRef, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import type { GraphNodeData, GraphEdgeData, SimNode } from '@/types/knowledge'

const props = defineProps<{
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
}>()

const containerRef = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const width = ref(800)
const height = ref(600)
const simNodes = shallowRef<SimNode[]>([])

const viewTransform = reactive({ x: 0, y: 0, scale: 1 })

const conflictPopup = reactive({
  visible: false, x: 0, y: 0, message: '', nodeId: '',
})

const REPULSION = 4000
const SPRING_LEN = 115
const SPRING_K = 0.028
const GRAVITY = 0.003
const DAMPING = 0.80
const MAX_ITER = 500

let dragNode: SimNode | null = null
let dragOffsetX = 0
let dragOffsetY = 0
let wasDragging = false
let isPanning = false
let panStartClientX = 0
let panStartClientY = 0
let panStartTX = 0
let panStartTY = 0
let rafId: number | null = null
let iteration = 0

// 悬停高亮逻辑
const hoveredNodeId = ref<string | null>(null)
const hoveredAdjacentIds = computed(() => {
  if (!hoveredNodeId.value) return new Set<string>()
  const adjacent = new Set<string>()
  for (const edge of props.edges) {
    if (edge.source === hoveredNodeId.value) adjacent.add(edge.target)
    if (edge.target === hoveredNodeId.value) adjacent.add(edge.source)
  }
  return adjacent
})

function initSim() {
  const cx = width.value / 2
  const cy = height.value / 2
  const n = props.nodes.length
  const r = Math.min(width.value, height.value) * 0.30
  simNodes.value = props.nodes.map((node, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return { ...node, x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 30, y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 30, vx: 0, vy: 0, fixed: false }
  })
  iteration = 0
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
}

function getSimNode(id: string): SimNode | undefined {
  return simNodes.value.find((n) => n.id === id)
}

function tick() {
  const nodes = simNodes.value
  const cx = width.value / 2
  const cy = height.value / 2
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i]
    if (ni.fixed) continue
    ni.vx += (cx - ni.x) * GRAVITY
    ni.vy += (cy - ni.y) * GRAVITY
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const nj = nodes[j]
      const dx = ni.x - nj.x
      const dy = ni.y - nj.y
      const dist2 = Math.max(dx * dx + dy * dy, 1)
      const dist = Math.sqrt(dist2)
      const f = REPULSION / dist2
      ni.vx += (dx / dist) * f
      ni.vy += (dy / dist) * f
    }
    ni.vx *= DAMPING
    ni.vy *= DAMPING
  }
  for (const edge of props.edges) {
    const src = getSimNode(edge.source)
    const tgt = getSimNode(edge.target)
    if (!src || !tgt) continue
    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
    const stretch = (dist - SPRING_LEN) * SPRING_K
    const fx = (dx / dist) * stretch
    const fy = (dy / dist) * stretch
    if (!src.fixed) { src.vx += fx; src.vy += fy }
    if (!tgt.fixed) { tgt.vx -= fx; tgt.vy -= fy }
  }
  const margin = 55
  for (const n of nodes) {
    if (n.fixed) continue
    n.x += n.vx
    n.y += n.vy
    if (n.x < margin) n.vx += (margin - n.x) * 0.06
    if (n.y < margin) n.vy += (margin - n.y) * 0.06
    if (n.x > width.value - margin) n.vx -= (n.x - (width.value - margin)) * 0.06
    if (n.y > height.value - margin) n.vy -= (n.y - (height.value - margin)) * 0.06
  }
  triggerRef(simNodes)
  iteration++
  if (iteration < MAX_ITER || dragNode !== null) { rafId = requestAnimationFrame(tick) } else { rafId = null }
}

function clientToScene(clientX: number, clientY: number) {
  const rect = svgRef.value!.getBoundingClientRect()
  const mx = clientX - rect.left
  const my = clientY - rect.top
  return { x: (mx - viewTransform.x) / viewTransform.scale, y: (my - viewTransform.y) / viewTransform.scale }
}

function onNodeMouseDown(e: MouseEvent, node: SimNode) {
  e.preventDefault()
  e.stopPropagation()
  wasDragging = false
  dragNode = node
  node.fixed = true
  const scene = clientToScene(e.clientX, e.clientY)
  dragOffsetX = scene.x - node.x
  dragOffsetY = scene.y - node.y
  iteration = 0
  if (rafId === null) rafId = requestAnimationFrame(tick)
}

function onSvgMouseDown(e: MouseEvent) {
  if (dragNode) return
  conflictPopup.visible = false
  isPanning = true
  panStartClientX = e.clientX
  panStartClientY = e.clientY
  panStartTX = viewTransform.x
  panStartTY = viewTransform.y
}

function onMouseMove(e: MouseEvent) {
  if (dragNode) {
    wasDragging = true
    const scene = clientToScene(e.clientX, e.clientY)
    dragNode.x = scene.x - dragOffsetX
    dragNode.y = scene.y - dragOffsetY
    triggerRef(simNodes)
  } else if (isPanning) {
    viewTransform.x = panStartTX + (e.clientX - panStartClientX)
    viewTransform.y = panStartTY + (e.clientY - panStartClientY)
  }
}

function onMouseUp() {
  if (dragNode) { dragNode.fixed = false; dragNode = null; iteration = Math.max(0, MAX_ITER - 80); if (rafId === null) rafId = requestAnimationFrame(tick) }
  isPanning = false
}

function onWheel(e: WheelEvent) {
  const rect = svgRef.value!.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const delta = e.deltaY > 0 ? 0.88 : 1.12
  const newScale = Math.min(Math.max(viewTransform.scale * delta, 0.25), 4)
  viewTransform.x = mx - (mx - viewTransform.x) * (newScale / viewTransform.scale)
  viewTransform.y = my - (my - viewTransform.y) * (newScale / viewTransform.scale)
  viewTransform.scale = newScale
}

function onNodeClick(e: MouseEvent, node: SimNode) {
  if (wasDragging) { wasDragging = false; return }
  if (!node.hasConflict) return
  const rect = containerRef.value!.getBoundingClientRect()
  let px = e.clientX - rect.left + 14
  let py = e.clientY - rect.top - 14
  if (px + 288 > rect.width) px = e.clientX - rect.left - 302
  if (py + 160 > rect.height) py = e.clientY - rect.top - 150
  conflictPopup.x = px
  conflictPopup.y = py
  conflictPopup.message = node.conflictDesc ?? '检测到知识冲突，请确认。'
  conflictPopup.nodeId = node.id
  conflictPopup.visible = true
}

function zoomIn() { scaleAround(width.value / 2, height.value / 2, 1.2) }
function zoomOut() { scaleAround(width.value / 2, height.value / 2, 1 / 1.2) }
function resetView() { viewTransform.x = 0; viewTransform.y = 0; viewTransform.scale = 1 }
function scaleAround(ax: number, ay: number, factor: number) {
  const newScale = Math.min(Math.max(viewTransform.scale * factor, 0.25), 4)
  viewTransform.x = ax - (ax - viewTransform.x) * (newScale / viewTransform.scale)
  viewTransform.y = ay - (ay - viewTransform.y) * (newScale / viewTransform.scale)
  viewTransform.scale = newScale
}

function nodeFillId(node: SimNode) {
  const type = node.hasConflict ? 'conflict' : node.type
  return `url(#ng-${type})`
}

// 节点透明度计算
function nodeOpacity(node: SimNode) {
  if (!hoveredNodeId.value) return 1
  if (node.id === hoveredNodeId.value) return 1
  if (hoveredAdjacentIds.value.has(node.id)) return 0.9
  return 0.3
}

// 连线透明度
function edgeOpacity(edge: GraphEdgeData) {
  if (!hoveredNodeId.value) return 0.35
  return (edge.source === hoveredNodeId.value || edge.target === hoveredNodeId.value) ? 0.85 : 0.06
}

// 连线颜色
function edgeStroke(edge: GraphEdgeData) {
  if (!hoveredNodeId.value) return 'rgba(180,210,255,0.35)'
  return (edge.source === hoveredNodeId.value || edge.target === hoveredNodeId.value) ? 'rgba(200,225,255,0.85)' : 'rgba(180,210,255,0.06)'
}

// 连线宽度
function edgeWidth(edge: GraphEdgeData) {
  if (!hoveredNodeId.value) return 1.2
  return (edge.source === hoveredNodeId.value || edge.target === hoveredNodeId.value) ? 2.5 : 0.8
}

let ro: ResizeObserver | null = null
onMounted(() => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth
    height.value = containerRef.value.clientHeight
    ro = new ResizeObserver((entries) => {
      const e = entries[0]
      width.value = e.contentRect.width
      height.value = e.contentRect.height
      initSim()
    })
    ro.observe(containerRef.value)
  }
  initSim()
})
onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  ro?.disconnect()
})
watch(() => props.nodes, initSim, { deep: false })
</script>

<template>
  <div ref="containerRef" class="kg-wrap" @mouseleave="hoveredNodeId = null; onMouseUp()">
    <svg ref="svgRef" class="kg-svg" :viewBox="`0 0 ${width} ${height}`" :style="{ cursor: isPanning ? 'grabbing' : 'grab' }" @mousedown="onSvgMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @wheel.prevent="onWheel">
      <defs>
        <radialGradient id="ng-concept" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#B8D0EA"/><stop offset="100%" stop-color="#4E7FAD"/></radialGradient>
        <radialGradient id="ng-note" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#B5D4B4"/><stop offset="100%" stop-color="#567A55"/></radialGradient>
        <radialGradient id="ng-document" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#DDD0B8"/><stop offset="100%" stop-color="#9E7A48"/></radialGradient>
        <radialGradient id="ng-conflict" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#F5A0A0"/><stop offset="100%" stop-color="#C83232"/></radialGradient>
        <filter id="fglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="fconflict" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <g :transform="`translate(${viewTransform.x},${viewTransform.y}) scale(${viewTransform.scale})`">
        <g class="kg-edges">
          <line v-for="(edge, i) in edges" :key="`e-${i}`" :x1="getSimNode(edge.source)?.x ?? 0" :y1="getSimNode(edge.source)?.y ?? 0" :x2="getSimNode(edge.target)?.x ?? 0" :y2="getSimNode(edge.target)?.y ?? 0" :stroke="edgeStroke(edge)" :stroke-width="edgeWidth(edge)" stroke-linecap="round" :opacity="edgeOpacity(edge)" style="transition: all 0.3s ease"/>
        </g>

        <g v-for="node in simNodes" :key="node.id" :transform="`translate(${node.x},${node.y})`" class="kg-node" :class="{ 'is-conflict': node.hasConflict }" :opacity="nodeOpacity(node)" style="cursor: grab; transition: opacity 0.25s ease" @mousedown.stop="onNodeMouseDown($event, node)" @click.stop="onNodeClick($event, node)" @mouseenter="hoveredNodeId = node.id" @mouseleave="hoveredNodeId = null">
          <circle v-if="node.hasConflict" r="26" fill="rgba(220, 50, 50, 0.12)" stroke="rgba(220, 50, 50, 0.3)" stroke-width="1" class="conflict-halo"/>
          <circle :r="node.hasConflict ? 20 : 17" :fill="nodeFillId(node)" :filter="node.hasConflict ? 'url(#fconflict)' : 'url(#fglow)'" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" class="kg-circle"/>
          <ellipse :cx="node.hasConflict ? -5 : -4" :cy="node.hasConflict ? -8 : -6" :rx="node.hasConflict ? 7 : 6" :ry="node.hasConflict ? 4 : 3" fill="rgba(255,255,255,0.28)" pointer-events="none"/>
          <g v-if="node.hasConflict" class="conflict-badge" pointer-events="none">
            <circle r="9" cx="17" cy="-17" fill="#FF3E3E" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
            <text x="17" y="-13" text-anchor="middle" class="badge-text">!</text>
          </g>
          <text :y="node.hasConflict ? 37 : 32" text-anchor="middle" class="kg-label" :class="{ 'conflict-label': node.hasConflict }" pointer-events="none">{{ node.label }}</text>
        </g>
      </g>
    </svg>

    <div class="kg-zoom-ctrl">
      <button class="zoom-btn" title="放大" @click.stop="zoomIn">＋</button>
      <button class="zoom-btn" title="复位" @click.stop="resetView">⌂</button>
      <button class="zoom-btn" title="缩小" @click.stop="zoomOut">－</button>
    </div>

    <div class="kg-legend">
      <div class="legend-item"><span class="dot concept"/>概念</div>
      <div class="legend-item"><span class="dot note"/>笔记</div>
      <div class="legend-item"><span class="dot document"/>文档</div>
      <div class="legend-item"><span class="dot conflict"/>冲突</div>
    </div>

    <Transition name="kg-popup">
      <div v-if="conflictPopup.visible" class="conflict-popup" :style="{ left: `${conflictPopup.x}px`, top: `${conflictPopup.y}px` }">
        <div class="cp-header"><span class="cp-icon">⚠️</span><span class="cp-title">知识冲突检测</span><button class="cp-close" @click="conflictPopup.visible = false">×</button></div>
        <p class="cp-body">{{ conflictPopup.message }}</p>
        <div class="cp-footer">
          <button class="cp-btn" @click="conflictPopup.visible = false">稍后处理</button>
          <button class="cp-btn primary" @click="conflictPopup.visible = false">立即确认</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kg-wrap { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 18px; background: rgba(18,22,38,0.72); backdrop-filter: blur(24px) saturate(1.4); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 0 1px rgba(255,255,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.35); }
.kg-svg { width: 100%; height: 100%; display: block; user-select: none; }
.kg-circle { transition: r 0.18s ease, stroke-width 0.18s ease; }
.kg-node:hover .kg-circle { stroke-width: 2.5; stroke: rgba(255,255,255,0.7); }
.conflict-halo { animation: halo-pulse 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes halo-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.15; transform: scale(1.35); } }
.kg-label { font-family: 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif; font-size: 10.5px; font-weight: 500; fill: rgba(220,232,248,0.82); letter-spacing: 0.3px; }
.conflict-label { fill: #FFD566; font-weight: 600; }
.badge-text { font-size: 10px; font-weight: 700; fill: #fff; }
.kg-zoom-ctrl { position: absolute; bottom: 18px; right: 18px; display: flex; flex-direction: column; gap: 5px; z-index: 10; }
.zoom-btn { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.75); cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); transition: background 0.18s, color 0.18s; }
.zoom-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }
.kg-legend { position: absolute; bottom: 18px; left: 18px; display: flex; flex-direction: column; gap: 6px; z-index: 10; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; backdrop-filter: blur(10px); }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: rgba(220,232,248,0.65); font-family: 'PingFang SC', system-ui, sans-serif; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.dot.concept { background: #7BA8D0; }
.dot.note { background: #7AAF79; }
.dot.document { background: #C4A06A; }
.dot.conflict { background: #E04040; box-shadow: 0 0 6px rgba(220,50,50,0.6); }
.conflict-popup { position: absolute; width: 288px; background: rgba(255,248,220,0.96); backdrop-filter: blur(14px); border: 1px solid rgba(240,170,60,0.45); border-radius: 14px; padding: 14px 16px; box-shadow: 0 0 0 1px rgba(255,200,80,0.25) inset, 0 12px 40px rgba(0,0,0,0.22); z-index: 100; }
.cp-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #7A4800; font-weight: 600; font-size: 13.5px; font-family: 'PingFang SC', system-ui, sans-serif; }
.cp-icon { font-size: 16px; }
.cp-title { flex: 1; }
.cp-close { background: none; border: none; cursor: pointer; color: #A06010; font-size: 18px; padding: 0 2px; opacity: 0.7; }
.cp-close:hover { opacity: 1; }
.cp-body { font-size: 12.5px; color: #5A3200; line-height: 1.7; margin: 0; font-family: 'PingFang SC', system-ui, sans-serif; }
.cp-footer { display: flex; gap: 8px; margin-top: 13px; justify-content: flex-end; }
.cp-btn { padding: 5px 14px; border-radius: 7px; border: 1px solid rgba(160,96,0,0.3); background: transparent; color: #7A4800; font-size: 12px; cursor: pointer; font-family: 'PingFang SC', system-ui, sans-serif; transition: background 0.15s; }
.cp-btn:hover { background: rgba(255,200,80,0.2); }
.cp-btn.primary { background: rgba(255,190,50,0.28); border-color: rgba(200,130,0,0.45); font-weight: 600; }
.kg-popup-enter-active, .kg-popup-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.kg-popup-enter-from, .kg-popup-leave-to { opacity: 0; transform: scale(0.88) translateY(-6px); }
</style>