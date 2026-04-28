// 知识条目类型
export interface KnowledgeItem {
  id: string
  title: string
  type: 'concept' | 'note' | 'document'
  topic: string
  summary: string
  tags: string[]
  updatedAt: string
  hasConflict: boolean
  conflictDesc?: string
}

// 图谱节点
export interface GraphNode {
  id: string
  label: string
  type: KnowledgeItem['type']
  topic: string
  hasConflict: boolean
  conflictDesc?: string
  x?: number
  y?: number
}

// 图谱连线
export interface GraphEdge {
  source: string
  target: string
}

// 筛选类型
export type KnowledgeFilter = 'all' | 'concept' | 'note' | 'document'

// 类型可视化配置
export const TYPE_CONFIG: Record<KnowledgeItem['type'], { label: string; color: string; bg: string; borderColor: string }> = {
  concept:  { label: '概念', color: '#7B9EC4', bg: 'rgba(123, 158, 196, 0.12)', borderColor: 'rgba(123, 158, 196, 0.25)' },
  note:     { label: '笔记', color: '#8BAF8A', bg: 'rgba(139, 175, 138, 0.12)', borderColor: 'rgba(139, 175, 138, 0.25)' },
  document: { label: '文档', color: '#C4A882', bg: 'rgba(196, 168, 130, 0.12)', borderColor: 'rgba(196, 168, 130, 0.25)' },
}

// 图谱组件使用的类型别名（与上方 GraphNode / GraphEdge 对应）
export type GraphNodeData = GraphNode
export type GraphEdgeData = GraphEdge
export type SimNode = GraphNode & {
  x: number
  y: number
  vx: number
  vy: number
  fixed: boolean
}