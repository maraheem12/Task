import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  lastClaimAt: timestamp("last_claim_at"),
});

export const pointsHistory = pgTable("points_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  pointsAwarded: integer("points_awarded").notNull(),
  claimedAt: timestamp("claimed_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalPoints: true,
  rank: true,
  lastClaimAt: true,
});

export const insertPointsHistorySchema = createInsertSchema(pointsHistory).omit({
  id: true,
  claimedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPointsHistory = z.infer<typeof insertPointsHistorySchema>;
export type PointsHistory = typeof pointsHistory.$inferSelect;
