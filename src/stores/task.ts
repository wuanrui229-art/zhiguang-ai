import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskStatus, SubTask } from '@/types/task'

let idCounter = 20

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([
    { id: '1', title: '路由模拟实验报告', deadline: '2026-05-07', priority: 'high', status: 'todo', source: 'qq-group', sourceLabel: '来自QQ群', subTasks: [
      { id: 's1', text: '查阅RIP/OSPF协议相关文献（3篇以上）', completed: false },
      { id: 's2', text: '使用Packet Tracer搭建模拟拓扑并截图', completed: false },
      { id: 's3', text: '撰写实验报告并整理数据对比表格', completed: false },
    ], createdAt: '2026-04-25' },
    { id: '2', title: '机器学习作业：CNN调参实验', deadline: '2026-05-05', priority: 'medium', status: 'todo', source: 'manual', sourceLabel: '手动创建', subTasks: [
      { id: 's4', text: '实现三种卷积核配置并记录准确率', completed: false },
      { id: 's5', text: '绘制训练曲线对比图', completed: false },
    ], createdAt: '2026-04-26' },
    { id: '3', title: '产品经理课程：竞品分析报告', deadline: '2026-05-10', priority: 'low', status: 'todo', source: 'qq-group', sourceLabel: '来自QQ群', subTasks: [
      { id: 's6', text: '选定3款竞品并收集信息', completed: false },
    ], createdAt: '2026-04-27' },
    { id: '4', title: '修改小组腾讯文档冲突段落', deadline: '2026-05-02', priority: 'high', status: 'todo', source: 'manual', sourceLabel: '来自腾讯文档', subTasks: [
      { id: 's7', text: '确认RIP收敛时间数据来源', completed: false },
      { id: 's8', text: '与张同学协商统一OSPF区域数量', completed: false },
    ], createdAt: '2026-04-28' },
    { id: '5', title: '准备计算机网络期中复习', deadline: '2026-05-03', priority: 'medium', status: 'in-progress', source: 'qq-group', sourceLabel: '来自QQ群', subTasks: [
      { id: 's9', text: '整理OSI七层模型笔记', completed: true },
      { id: 's10', text: '复习TCP三次握手四次挥手', completed: false },
      { id: 's11', text: '做课后习题1-15题', completed: false },
    ], createdAt: '2026-04-24' },
    { id: '6', title: '完善知识库图谱节点分类', deadline: '2026-05-04', priority: 'low', status: 'in-progress', source: 'manual', sourceLabel: '手动创建', subTasks: [
      { id: 's12', text: '检查计算机网络分类准确性', completed: true },
      { id: 's13', text: '补充机器学习模块缺失概念', completed: false },
    ], createdAt: '2026-04-25' },
    { id: '7', title: '撰写洞察工作室输出模板', deadline: '2026-05-06', priority: 'medium', status: 'in-progress', source: 'manual', sourceLabel: '手动创建', subTasks: [
      { id: 's14', text: '小红书风格模板定稿', completed: true },
      { id: 's15', text: '公众号长文模板定稿', completed: false },
      { id: 's16', text: 'Star法则简历模板', completed: false },
    ], createdAt: '2026-04-26' },
    { id: '8', title: '安装配置MarkItDown引擎', deadline: '2026-04-20', priority: 'high', status: 'done', source: 'manual', sourceLabel: '手动创建', subTasks: [
      { id: 's17', text: 'pip install markitdown', completed: true },
      { id: 's18', text: '测试PDF转Markdown', completed: true },
    ], createdAt: '2026-04-18' },
    { id: '9', title: '完成织光AI V1.0 PRD初稿', deadline: '2026-04-22', priority: 'medium', status: 'done', source: 'manual', sourceLabel: '手动创建', subTasks: [
      { id: 's19', text: '用户痛点分析', completed: true },
      { id: 's20', text: '功能模块设计', completed: true },
      { id: 's21', text: '技术架构图绘制', completed: true },
    ], createdAt: '2026-04-19' },
  ])

  const todoTasks = computed(() => tasks.value.filter(t => t.status === 'todo'))
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in-progress'))
  const doneTasks = computed(() => tasks.value.filter(t => t.status === 'done'))

  function moveTask(taskId: string, newStatus: TaskStatus) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) task.status = newStatus
  }

  function toggleSubTask(taskId: string, subId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    const sub = task?.subTasks.find(s => s.id === subId)
    if (sub) sub.completed = !sub.completed
  }

  function addTask(params: { title: string; deadline?: string; priority: 'low' | 'medium' | 'high' }) {
    const newTask: Task = {
      id: String(++idCounter),
      title: params.title,
      deadline: params.deadline,
      priority: params.priority,
      status: 'todo',
      source: 'manual',
      sourceLabel: '手动创建',
      subTasks: [],
      createdAt: new Date().toISOString(),
    }
    tasks.value.unshift(newTask)
    return newTask
  }

  function setSubTasks(taskId: string, subs: SubTask[]) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) task.subTasks = subs
  }

  function generateAISubTasks(): SubTask[] {
    const templates = [
      '查找相关资料并整理出核心要点',
      '撰写大纲及内容框架',
      '完成初稿并发送给组员审阅',
      '根据反馈修改并最终定稿',
      '准备展示PPT及演讲稿',
    ]
    const count = Math.floor(Math.random() * 3) + 2
    return Array.from({ length: count }, (_, i) => ({
      id: `ai_${Date.now()}_${i}`,
      text: templates[i % templates.length],
      completed: false,
    }))
  }

  return { tasks, todoTasks, inProgressTasks, doneTasks, moveTask, toggleSubTask, addTask, setSubTasks, generateAISubTasks }
})