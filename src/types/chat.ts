export interface TaskCardData {
  title: string
  deadline: string
  subtasks: { id: string; text: string; completed: boolean }[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isTyping?: boolean
  taskCard?: TaskCardData
}