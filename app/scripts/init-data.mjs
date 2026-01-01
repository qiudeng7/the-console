#!/usr/bin/env node
/**
 * 数据库初始化脚本（ES Module 版本）
 * 用于在 Docker 容器中执行
 */

import { getDb } from '../server/database/db.js'
import { User, Task } from '../server/database/schema.js'

async function initData() {
  try {
    console.log('📦 开始初始化数据...')
    const db = getDb()

    // 创建管理员和员工账号（明文密码）
    // 检查用户是否已存在
    const existingUsers = await db.select({ id: User.id, email: User.email }).from(User)

    if (existingUsers.length === 0) {
      console.log('👤 创建初始用户...')
      await db.insert(User).values([
        {
          email: 'admin@the-console.com',
          password: 'admin123',
          role: 'admin'
        },
        {
          email: 'employee@the-console.com',
          password: 'employee123',
          role: 'employee'
        }
      ])
      console.log('✅ 初始用户创建成功')
      console.log('   管理员: admin@the-console.com / admin123')
      console.log('   员工: employee@the-console.com / employee123')
    } else {
      console.log('ℹ️  用户已存在，跳过创建')
    }

    // 创建测试任务
    const existingTasks = await db.select({ id: Task.id }).from(Task)

    if (existingTasks.length === 0) {
      console.log('📋 创建测试任务...')
      const users = await db.select().from(User)
      const adminUser = users.find(u => u.role === 'admin')
      const employeeUser = users.find(u => u.role === 'employee')

      if (adminUser && employeeUser) {
        await db.insert(Task).values([
          {
            title: '测试任务1 - UI测试',
            category: 'testing',
            tag: 'UI测试',
            description: '这是一个测试任务，请执行UI测试用例并记录结果。\n\n测试内容：\n1. 检查页面布局\n2. 测试表单提交\n3. 验证响应式设计',
            status: 'todo',
            createdByUserId: adminUser.id,
            assignedToUserId: employeeUser.id
          },
          {
            title: '测试任务2 - API测试',
            category: 'testing',
            tag: 'API测试',
            description: '测试API接口功能\n\n需要测试的接口：\n- GET /api/tasks\n- POST /api/tasks\n- PATCH /api/tasks/[id]',
            status: 'todo',
            createdByUserId: adminUser.id,
            assignedToUserId: employeeUser.id
          },
          {
            title: '测试任务3 - 性能测试',
            category: 'testing',
            tag: '性能测试',
            description: '测试系统性能指标\n\n测试项目：\n- 页面加载时间\n- API响应时间\n- 并发处理能力',
            status: 'todo',
            createdByUserId: adminUser.id,
            assignedToUserId: employeeUser.id
          }
        ])
        console.log('✅ 测试任务创建成功 (3个任务)')
      }
    } else {
      console.log('ℹ️  测试任务已存在，跳过创建')
    }

    console.log('\n🎉 数据库初始化完成！')
    console.log('📝 登录信息：')
    console.log('   管理员: admin@the-console.com / admin123')
    console.log('   员工: employee@the-console.com / employee123')

    process.exit(0)
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

initData()
