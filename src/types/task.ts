export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  deadline?: string
  priority: 'low' | 'medium' | 'high'
  status: TaskStatus
  source?: 'qq-group' | 'manual'
  sourceLabel?: string
  subTasks: SubTask[]
  createdAt: string
}