import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { KnowledgeItem, GraphNode, GraphEdge } from '@/types/knowledge'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const items = ref<KnowledgeItem[]>([
    { id: '1', title: 'OSI 七层模型详解', type: 'concept', topic: '计算机网络', summary: 'OSI模型将网络通信划分为物理层、数据链路层、网络层、传输层、会话层、表示层和应用层七个层次，每一层都有独立的功能和协议。', tags: ['OSI', '基础概念', '网络分层'], updatedAt: '2026-04-25', hasConflict: false },
    { id: '2', title: 'TCP 三次握手与四次挥手', type: 'note', topic: '计算机网络', summary: '记录了TCP连接建立的三次握手过程：SYN、SYN-ACK、ACK，以及断开连接的四次挥手。重点标注了TIME_WAIT状态的作用。', tags: ['TCP', '面试', '传输层'], updatedAt: '2026-04-24', hasConflict: false },
    { id: '3', title: 'RIP 与 OSPF 协议对比', type: 'note', topic: '计算机网络', summary: 'RIP基于距离向量算法，最大跳数15；OSPF基于链路状态算法，收敛更快，适用于大型网络。', tags: ['路由协议', 'RIP', 'OSPF'], updatedAt: '2026-04-22', hasConflict: true, conflictDesc: '关于RIP收敛时间的数值与教材存在差异：笔记记为30s，教材为180s' },
    { id: '4', title: '计算机网络课件 - 网络层', type: 'document', topic: '计算机网络', summary: '张老师第五章课件，涵盖IP协议、子网划分、CIDR、路由聚合等核心内容。', tags: ['课件', '网络层', 'IP协议'], updatedAt: '2026-04-20', hasConflict: false },
    { id: '5', title: 'TCP 拥塞控制算法演变', type: 'concept', topic: '计算机网络', summary: '从Tahoe到Reno再到CUBIC，梳理了TCP拥塞控制算法的发展脉络。', tags: ['拥塞控制', 'TCP', '算法'], updatedAt: '2026-04-18', hasConflict: false },
    { id: '6', title: 'VLAN 与 Trunk 配置实验', type: 'note', topic: '计算机网络', summary: '记录了VLAN配置实验过程，包含交换机端口划分、Trunk链路配置。', tags: ['VLAN', '实验', '交换机'], updatedAt: '2026-04-15', hasConflict: false },
    { id: '7', title: 'Batch Normalization 原理', type: 'concept', topic: '机器学习', summary: 'BN层通过标准化每一层的输入，缓解内部协变量偏移问题，加速训练收敛。', tags: ['BN', '深度学习', '训练技巧'], updatedAt: '2026-04-25', hasConflict: true, conflictDesc: '关于BN放置位置存在两处矛盾：论文建议激活前，部分实践建议激活后' },
    { id: '8', title: 'CNN 卷积核尺寸选择心得', type: 'note', topic: '机器学习', summary: '整理了不同任务中卷积核尺寸的选择经验：图像分类多用3x3堆叠。', tags: ['CNN', '卷积核', '调参'], updatedAt: '2026-04-23', hasConflict: false },
    { id: '9', title: '机器学习课件 - 集成学习', type: 'document', topic: '机器学习', summary: '李老师第七章课件，系统讲解Bagging、Boosting和Stacking三大集成方法。', tags: ['课件', '集成学习', 'XGBoost'], updatedAt: '2026-04-21', hasConflict: false },
    { id: '10', title: 'Transformer 架构拆解', type: 'concept', topic: '机器学习', summary: '逐一解析Transformer的Self-Attention、Multi-Head Attention等核心组件。', tags: ['Transformer', 'Attention', 'NLP'], updatedAt: '2026-04-19', hasConflict: false },
    { id: '11', title: '过拟合应对策略手册', type: 'note', topic: '机器学习', summary: '系统整理了8种缓解过拟合的方法：Dropout、L1/L2正则化、Early Stopping等。', tags: ['过拟合', '正则化', '调参'], updatedAt: '2026-04-17', hasConflict: false },
    { id: '12', title: '梯度消失与梯度爆炸', type: 'concept', topic: '机器学习', summary: '解释了深层网络中梯度消失和爆炸的数学原因，以及ReLU、残差连接等解决方案。', tags: ['梯度', '深度学习', '激活函数'], updatedAt: '2026-04-14', hasConflict: false },
    { id: '13', title: 'PyTorch 模型部署流程', type: 'note', topic: '机器学习', summary: '记录了从PyTorch模型导出ONNX格式，到使用TensorRT加速推理的完整流程。', tags: ['PyTorch', '部署', 'ONNX'], updatedAt: '2026-04-12', hasConflict: false },
    { id: '14', title: 'PRD 文档撰写规范', type: 'document', topic: '产品经理', summary: '腾讯内部PRD培训资料，涵盖需求背景、用户故事、功能描述等六大模块。', tags: ['PRD', '文档规范', '腾讯'], updatedAt: '2026-04-24', hasConflict: false },
    { id: '15', title: '用户旅程图示例 - 购物App', type: 'note', topic: '产品经理', summary: '以淘宝购物为例，绘制了完整的用户旅程图，标注了情感曲线和痛点机会。', tags: ['用户旅程图', 'UX', '电商'], updatedAt: '2026-04-22', hasConflict: false },
    { id: '16', title: 'STAR 法则在简历中的应用', type: 'concept', topic: '产品经理', summary: 'Situation-Task-Action-Result法则，附5个PM简历优化案例。', tags: ['STAR', '简历', '求职'], updatedAt: '2026-04-20', hasConflict: false },
    { id: '17', title: '竞品分析框架', type: 'concept', topic: '产品经理', summary: '介绍了SWOT、波特五力、功能矩阵三种竞品分析框架。', tags: ['竞品分析', '方法论', 'SWOT'], updatedAt: '2026-04-18', hasConflict: false },
    { id: '18', title: '微信读书产品拆解笔记', type: 'note', topic: '产品经理', summary: '从信息架构、阅读体验、社交裂变、商业化四个维度拆解了微信读书。', tags: ['产品拆解', '微信读书', '留存'], updatedAt: '2026-04-15', hasConflict: false },
    { id: '19', title: 'A/B 测试实验设计', type: 'document', topic: '产品经理', summary: '讲解A/B测试的统计学基础，以及实验分流和指标选择的工程实践。', tags: ['AB测试', '数据分析', '实验设计'], updatedAt: '2026-04-13', hasConflict: false },
    { id: '20', title: '需求优先级排序方法', type: 'concept', topic: '产品经理', summary: '对比了MoSCoW、Kano模型、ICE评分、RICE评分四种方法。', tags: ['需求管理', '优先级', 'Kano'], updatedAt: '2026-04-10', hasConflict: false },
  ])

  const stats = computed(() => {
    const total = items.value.length
    const concept = items.value.filter(i => i.type === 'concept').length
    const note = items.value.filter(i => i.type === 'note').length
    const document = items.value.filter(i => i.type === 'document').length
    const conflicts = items.value.filter(i => i.hasConflict).length
    return { total, concept, note, document, conflicts }
  })

  const graphNodes = computed<GraphNode[]>(() => {
    return items.value.map(item => ({
      id: item.id,
      label: item.title,
      type: item.type,
      topic: item.topic,
      hasConflict: item.hasConflict,
      conflictDesc: item.conflictDesc,
    }))
  })

  const graphEdges = computed<GraphEdge[]>(() => {
    const edges: GraphEdge[] = []
    const arr = items.value
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const sameTopic = arr[i].topic === arr[j].topic
        const sharedTags = arr[i].tags.some(t => arr[j].tags.includes(t))
        if (sameTopic || sharedTags) {
          edges.push({ source: arr[i].id, target: arr[j].id })
        }
      }
    }
    return edges
  })

  function addItem(item: {
    title: string
    type: 'concept' | 'note' | 'document'
    topic: string
    summary: string
    tags: string[]
    hasConflict: boolean
  }) {
    const newItem: KnowledgeItem = {
      id: String(Date.now()),
      ...item,
      updatedAt: new Date().toISOString(),
    }
    items.value.unshift(newItem)
  }

  return { items, stats, graphNodes, graphEdges, addItem }
})