import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  systemType: text("systemType").notNull(), // 'on-grid' | 'off-grid' | 'hybrid' | 'pumping'
  inputs: jsonb("inputs").notNull().default({}),
  results: jsonb("results").notNull().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;
export type ProjectResponse = Project;
export type ProjectsListResponse = Project[];
