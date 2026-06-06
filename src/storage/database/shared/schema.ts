import { pgTable, serial, timestamp, text, index, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey().notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_uq").on(table.username),
    uniqueIndex("users_email_uq").on(table.email),
    index("users_created_at_idx").on(table.created_at),
  ],
);

// Blog posts table
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey().notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_created_at_idx").on(table.created_at),
  ]
);

export const emailLeads = pgTable(
  "email_leads",
  {
    id: serial("id").primaryKey().notNull(),
    email: text("email").notNull(),
    source: text("source").notNull(),
    prompt: text("prompt"),
    style: text("style"),
    effect_image_url: text("effect_image_url"),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("email_leads_email_idx").on(table.email),
    index("email_leads_source_idx").on(table.source),
    index("email_leads_created_at_idx").on(table.created_at),
  ],
);

export const resultFeedback = pgTable(
  "result_feedback",
  {
    id: serial("id").primaryKey().notNull(),
    email: text("email"),
    rating: text("rating").notNull(),
    comment: text("comment"),
    prompt: text("prompt"),
    effect_image_url: text("effect_image_url"),
    explosion_image_url: text("explosion_image_url"),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("result_feedback_rating_idx").on(table.rating),
    index("result_feedback_created_at_idx").on(table.created_at),
  ],
);

export const generationPackages = pgTable(
  "generation_packages",
  {
    id: serial("id").primaryKey().notNull(),
    user_id: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
    input_image_url: text("input_image_url"),
    input_image_hash: text("input_image_hash"),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true, mode: 'string' })
      .default(sql`(now() + interval '7 days')`)
      .notNull(),
  },
  (table) => [
    index("generation_packages_user_id_idx").on(table.user_id),
    index("generation_packages_expires_at_idx").on(table.expires_at),
    index("generation_packages_created_at_idx").on(table.created_at),
  ],
);

export const generationRuns = pgTable(
  "generation_runs",
  {
    id: serial("id").primaryKey().notNull(),
    package_id: integer("package_id").notNull().references(() => generationPackages.id, { onDelete: 'cascade' }),
    user_id: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
    type: text("type").notNull(),
    input_image_url: text("input_image_url"),
    input_image_hash: text("input_image_hash"),
    description: text("description").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    size: text("size").notNull(),
    watermark: boolean("watermark").notNull(),
    status: text("status").notNull(),
    result_image_url: text("result_image_url"),
    latency_ms: integer("latency_ms"),
    error_code: text("error_code"),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true, mode: 'string' })
      .default(sql`(now() + interval '7 days')`)
      .notNull(),
  },
  (table) => [
    index("generation_runs_package_id_idx").on(table.package_id),
    index("generation_runs_user_id_idx").on(table.user_id),
    index("generation_runs_type_idx").on(table.type),
    index("generation_runs_result_image_url_idx").on(table.result_image_url),
    index("generation_runs_expires_at_idx").on(table.expires_at),
    index("generation_runs_created_at_idx").on(table.created_at),
  ],
);

export const generationMaterials = pgTable(
  "generation_materials",
  {
    id: serial("id").primaryKey().notNull(),
    run_id: integer("run_id").notNull().references(() => generationRuns.id, { onDelete: 'cascade' }),
    layer: text("layer").notNull(),
    material: text("material").notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("generation_materials_run_id_idx").on(table.run_id),
    index("generation_materials_created_at_idx").on(table.created_at),
  ],
);

export type AppUser = typeof users.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type EmailLead = typeof emailLeads.$inferSelect;
export type InsertEmailLead = typeof emailLeads.$inferInsert;
export type ResultFeedback = typeof resultFeedback.$inferSelect;
export type InsertResultFeedback = typeof resultFeedback.$inferInsert;
