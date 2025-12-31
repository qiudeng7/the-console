import { sql } from 'drizzle-orm'
import { mysqlTable, varchar, int, text, datetime } from 'drizzle-orm/mysql-core'

const common = {
  id: int().primaryKey().autoincrement(),

  /** usage: `...common.timestamps` */
  timestamps: {
    createdAt: datetime({ fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
    deletedAt: datetime({ fsp: 3 })
  }
}

export const User = mysqlTable('user_table', {
  id: common.id,
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('employee'), // 'admin' | 'employee'
  version: int().default(1).notNull(), // 乐观锁版本号
  updatedAt: datetime({ fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`).notNull(),
  deletedAt: common.timestamps.deletedAt
})

export const Task = mysqlTable('task_table', {
  id: common.id,
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  tag: varchar('tag', { length: 100 }),
  description: text(),
  status: varchar('status', { length: 20 }).notNull(),
  createdByUserId: int().notNull().references(() => User.id),
  assignedToUserId: int().references(() => User.id),
  version: int().default(1).notNull(), // 乐观锁版本号
  createdAt: common.timestamps.createdAt,
  updatedAt: datetime({ fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`).notNull(),
  deletedAt: common.timestamps.deletedAt
})

export const K8sCluster = mysqlTable('k8s_cluster_table', {
  id: common.id,
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // creating | running | failed | deleting
  description: text(),
  region: varchar('region', { length: 50 }).default('ap-nanjing'),
  podCidr: varchar('pod_cidr', { length: 50 }).default('10.244.0.0/24'),
  serviceCidr: varchar('service_cidr', { length: 50 }).default('10.96.0.0/16'),
  createdAt: common.timestamps.createdAt,
  deletedAt: common.timestamps.deletedAt
})

export const K8sNode = mysqlTable('k8s_node_table', {
  id: common.id,
  clusterId: int().notNull().references(() => K8sCluster.id),
  instanceId: varchar('instance_id', { length: 255 }).notNull(),
  nodeName: varchar('node_name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull(), // control-plane | worker
  status: varchar('status', { length: 50 }).notNull(), // initializing | joining | ready | failed | removing
  createdAt: common.timestamps.createdAt,
  deletedAt: common.timestamps.deletedAt
})
