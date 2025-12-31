import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core'

const common = {
  id: int().primaryKey({ autoIncrement: true }),

  /** usage: `...common.timestamps` */
  timestamps: {
    /** toLocaleString format be like '2025/12/22 13:59:52'  */
    createdAt: text().notNull().default(new Date().toLocaleString()),
    deletedAt: text().default('')
  }
}

export const User = sqliteTable('user_table', {
  id: common.id,
  ...common.timestamps,
  email: text().notNull(),
  password: text().notNull(),
  role: text().notNull().default('employee') // 'admin' | 'employee'
})

export const Task = sqliteTable('task_table', {
  id: common.id,
  ...common.timestamps,
  title: text(),
  category: text(),
  tag: text(),
  description: text(),
  status: text(),
  createdByUserId: int().notNull().references(() => User.id),
  assignedToUserId: int().references(() => User.id),
  updatedAt: text().default('')
})

export const K8sCluster = sqliteTable('k8s_cluster_table', {
  id: common.id,
  ...common.timestamps,
  name: text().notNull(),
  status: text().notNull(), // creating | running | failed | deleting
  description: text(),
  region: text().default('ap-nanjing'),
  podCidr: text().default('10.244.0.0/24'),
  serviceCidr: text().default('10.96.0.0/16')
})

export const K8sNode = sqliteTable('k8s_node_table', {
  id: common.id,
  ...common.timestamps,
  clusterId: int().notNull().references(() => K8sCluster.id),
  instanceId: text().notNull(),
  nodeName: text(),
  role: text().notNull(), // control-plane | worker
  status: text().notNull() // initializing | joining | ready | failed | removing
})
