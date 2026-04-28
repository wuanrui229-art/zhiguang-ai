import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, TaskCardData } from '@/types/chat'
import { useTaskStore } from '@/stores/task'

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

  // ── 调用 Kimi API ──────────────────────────────────────
  async function callKimiAPI(userMessage: string): Promise<string | null> {
    const apiKey = import.meta.env.VITE_KIMI_API_KEY
    if (!apiKey) {
      console.warn('API Key 未配置，使用 Mock 回复')
      return null
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
            {
              role: 'system',
              content: '你是织光AI，一个深度融合腾讯生态（QQ群、腾讯文档）的校园知识助手。你帮助大学生管理DDL、整理知识库、检测协作冲突。回答简洁亲切，用中文，不超过150字。'
            },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 300
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

  // ── 发送消息（API 优先，失败降级 Mock）─────────────────
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
        content: '收到！我检测到这是一条来自QQ群的任务消息。已自动提取DDL（下周三），并拆解为3个子任务。你可以前往"任务"看板管理进度。',
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
        content: `已收到《${fileName}》，正在使用MarkItDown引擎解析文档结构，并提取核心概念存入你的知识库。`,
        timestamp: Date.now(),
        isTyping: true
      }
      messages.value.push(aiMsg)
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
        const aiMsg: ChatMessage = {
          id: String(++msgId),
          role: 'assistant',
          content: '好的，我已理解你的问题。这是一个基于你个人知识库的回答示例——实际使用时，我会先检索你的所有笔记和课件，再给出有据可依的回复。',
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
      content: '⚠️ 检测到你的小组成员【张同学】3分钟前更新了腾讯文档「路由模拟实验报告」中「实验数据对比」段落，与你昨天提交的版本存在2处数值冲突。\n\n**冲突点1**：RIP收敛时间（你：30s / 对方：45s）\n**冲突点2**：OSPF区域数量（你：3个 / 对方：5个）\n\n请确认以哪个版本为准，或直接跳转腾讯文档在线协商。',
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