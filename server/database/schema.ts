import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

const common = {
    id: int().primaryKey({ autoIncrement: true }),

    /** usage: `...common.timestamps` */
    timestamps: {
        /** toLocaleString format be like '2025/12/22 13:59:52'  */
        createdAt: text().notNull().default(new Date().toLocaleString()),
        deletedAt: text().default(""),
    }
}

export const User = sqliteTable("user_table", {
    id: common.id,
    ...common.timestamps,

    email: text().notNull(),
    password: text().notNull(),
})

export const Task = sqliteTable("task_table", {
    id: common.id,
    ...common.timestamps,

    title: text(),
    category: text(),
    tag: text(),
    description: text(),
    status: text(),
});