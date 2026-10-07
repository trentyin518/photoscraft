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
