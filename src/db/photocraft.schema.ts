import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const photoToolTypeEnum = ["enhance", "restore", "colorize", "watermark", "bg", "eraser", "expression", "hairstyle", "bg-change", "sky", "avatar", "scene", "anime", "cartoon", "transform", "room"] as const;
export type PhotoToolType = (typeof photoToolTypeEnum)[number];

export const photoJobStatusEnum = ["pending", "processing", "done", "failed"] as const;
export type PhotoJobStatus = (typeof photoJobStatusEnum)[number];

export const photoJob = pgTable("photo_job", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  tool: text("tool").notNull().$type<PhotoToolType>(),
  inputUrl: text("input_url").notNull(),
  outputUrl: text("output_url"),
  status: text("status").notNull().default("pending").$type<PhotoJobStatus>(),
  params: jsonb("params").$type<Record<string, unknown>>().default({}),
  costCredits: integer("cost_credits").notNull().default(1),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("photo_job_user_idx").on(t.userId),
  statusIdx: index("photo_job_status_idx").on(t.status),
  toolIdx: index("photo_job_tool_idx").on(t.tool),
}));

export const showcaseStatusEnum = ["pending", "approved", "rejected"] as const;
export type ShowcaseStatus = (typeof showcaseStatusEnum)[number];

export const showcaseCase = pgTable("showcase_case", {
  id: text("id").primaryKey().$type<string>(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  photoJobId: text("photo_job_id").references(() => photoJob.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  tool: text("tool").$type<PhotoToolType>(),
  status: text("status").notNull().default("pending").$type<ShowcaseStatus>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("showcase_case_user_idx").on(t.userId),
  statusIdx: index("showcase_case_status_idx").on(t.status),
}));

export const showcaseComment = pgTable("showcase_comment", {
  id: text("id").primaryKey().$type<string>(),
  caseId: text("case_id")
    .notNull()
    .references(() => showcaseCase.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending").$type<ShowcaseStatus>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  caseIdx: index("showcase_comment_case_idx").on(t.caseId),
  statusIdx: index("showcase_comment_status_idx").on(t.status),
}));

export const feedbackStatusEnum = ["open", "reviewed", "resolved"] as const;
export type FeedbackStatus = (typeof feedbackStatusEnum)[number];

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey().$type<string>(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("suggestion"),
  content: text("content").notNull(),
  status: text("status").notNull().default("open").$type<FeedbackStatus>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("feedback_user_idx").on(t.userId),
  statusIdx: index("feedback_status_idx").on(t.status),
}));

export const creditBalance = pgTable("credit_balance", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(5),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const TOOL_CREDIT_COST: Record<PhotoToolType, number> = {
  enhance: 1,
  restore: 2,
  colorize: 2,
  watermark: 1,
  bg: 1,
  eraser: 1,
  expression: 2,
  hairstyle: 2,
  "bg-change": 1,
  sky: 1,
  avatar: 2,
  scene: 2,
  anime: 2,
  cartoon: 2,
  transform: 2,
  room: 2,
};
