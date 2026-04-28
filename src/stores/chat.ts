import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, TaskCardData } from '@/types/chat'
import { useTaskStore } from '@/stores/task'
import { useKnowledgeStore } from '@/stores/knowledge'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isAiReplying = ref(false)
  let msgId = 0

  function addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    messages.value.push({
      ...msg,
      id: String(++msgId),
      timestamp: Date.now()
    })
  }

  // ── 在知识库中检索 ──────────────────────────────────
  function searchKnowledge(query: string): string {
    const knowledgeStore = useKnowledgeStore()
    const q = query.toLowerCase()
    const matched = knowledgeStore.items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.toLowerCase().includes(q))
    )

    if (matched.length === 0) return ''

    // 取前3条最相关的
    const snippets = matched.slice(0, 3).map(item =>
      `【${item.title}】（类型：${item.type}，标签：${item.tags.join('、')}）\n${item.summary}`
    )
    return snippets.join('\n\n')
  }

  // ── 调用 Kimi API（支持知识库上下文）───────────────
  async function callKimiAPI(userMessage: string): Promise<string | null> {
    const apiKey = import.meta.env.VITE_KIMI_API_KEY
    if (!apiKey) {
      console.warn('API Key 未配置，使用 Mock 回复')
      return null
    }

    // 检索知识库
    const knowledgeContext = searchKnowledge(userMessage)

    // 构建系统提示词
    let systemPrompt = '你是织光AI，一个服务于大学生的校园知识助手。回答简洁亲切，用中文，不超过200字。'
    if (knowledgeContext) {
      systemPrompt += `\n\n以下是从用户个人知识库中检索到的相关内容，请优先基于这些内容回答问题，并在回复中提及信息来源：\n\n${knowledgeContext}`
    }

    try {
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (!response.ok) return null
      const data = await response.json()
      return data.choices[0].message.content || null
    } catch (error) {
      console.error('API 调用失败:', error)
      return null
    }
  }

  // ── 发送消息 ───────────────────────────────────────
  async function sendMessage(text: string) {
    addMessage({ role: 'user', content: text })
    isAiReplying.value = true

    const isQQ = text.includes('【QQ群') || text.includes('QQ群')

    if (isQQ) {
      const taskCard: TaskCardData = {
        title: '路由模拟实验报告',
        deadline: '2026-05-07',
        subtasks: [
          { id: '1', text: '查阅RIP/OSPF协议相关文献（3篇以上）', completed: false },
          { id: '2', text: '使用Packet Tracer搭建模拟拓扑并截图', completed: false },
          { id: '3', text: '撰写实验报告并整理数据对比表格', completed: false }
        ]
      }
      const aiMsg: ChatMessage = {
        id: String(++msgId),
        role: 'assistant',
        content: '收到！我检测到这是一条来自QQ群的任务消息。已自动提取截止时间，并拆解为3个子任务。你可以前往任务看板管理进度。',
        timestamp: Date.now(),
        isTyping: true,
        taskCard
      }
      messages.value.push(aiMsg)

      const taskStore = useTaskStore()
      taskStore.addTask({
        title: '路由模拟实验报告',
        deadline: '2026-05-07',
        priority: 'high'
      })
      const newTask = taskStore.tasks[0]
      if (newTask) {
        newTask.source = 'qq-group'
        newTask.sourceLabel = '来自QQ群'
        taskStore.setSubTasks(newTask.id, [
          { id: 's1', text: '查阅RIP/OSPF协议相关文献（3篇以上）', completed: false },
          { id: 's2', text: '使用Packet Tracer搭建模拟拓扑并截图', completed: false },
          { id: 's3', text: '撰写实验报告并整理数据对比表格', completed: false },
        ])
      }
    } else if (text.startsWith('📎')) {
      const fileName = text.replace('📎 ', '')
      const aiMsg: ChatMessage = {
        id: String(++msgId),
        role: 'assistant',
        content: `已收到《${fileName}》，正在使用文档解析引擎解析文档结构，并提取核心概念存入你的知识库。`,
        timestamp: Date.now(),
        isTyping: true
      }
      messages.value.push(aiMsg)

      const knowledgeStore = useKnowledgeStore()
      knowledgeStore.addItem({
        title: fileName,
        type: 'document',
        topic: '上传文件',
        summary: `用户上传的《${fileName}》，已通过文档解析并提取核心概念。`,
        tags: ['上传文件', '文档解析'],
        hasConflict: false
      })
    } else {
      const apiReply = await callKimiAPI(text)

      if (apiReply) {
        const aiMsg: ChatMessage = {
          id: String(++msgId),
          role: 'assistant',
          content: apiReply,
          timestamp: Date.now(),
          isTyping: true
        }
        messages.value.push(aiMsg)
      } else {
        // 降级 Mock：也尝试检索知识库
        const knowledgeContext = searchKnowledge(text)
        let mockReply = '好的，我已理解你的问题。'
        if (knowledgeContext) {
          mockReply += '根据你的知识库，我找到了以下相关内容：\n\n' + knowledgeContext.slice(0, 300) + '\n\n你可以切换到知识库页面查看详情。'
        } else {
          mockReply += '这是一个示例回复——实际使用时，我会检索你的笔记和课件，给出有据可依的回答。'
        }
        const aiMsg: ChatMessage = {
          id: String(++msgId),
          role: 'assistant',
          content: mockReply,
          timestamp: Date.now(),
          isTyping: true
        }
        messages.value.push(aiMsg)
      }
    }

    isAiReplying.value = false
  }

  function injectQQMessage(): string {
    return '【QQ群-计算机网络】张老师：下周三交路由模拟实验报告，三人一组'
  }

  function markTypingDone(id: string) {
    const msg = messages.value.find(m => m.id === id)
    if (msg) msg.isTyping = false
  }

  function triggerConflictAlert() {
    const conflictMsg: ChatMessage = {
      id: String(++msgId),
      role: 'assistant',
      content: '⚠️ 检测到你的小组成员3分钟前更新了腾讯文档「路由模拟实验报告」中「实验数据对比」段落，与你昨天提交的版本存在2处数值冲突。\n\n**冲突点1**：RIP收敛时间不一致\n**冲突点2**：OSPF区域数量不一致\n\n请确认以哪个版本为准，或直接跳转腾讯文档在线协商。',
      timestamp: Date.now(),
      isTyping: true,
      taskCard: undefined
    }
    messages.value.push(conflictMsg)
  }

  return {
    messages,
    isAiReplying,
    sendMessage,
    injectQQMessage,
    markTypingDone,
    triggerConflictAlert,
  }
})