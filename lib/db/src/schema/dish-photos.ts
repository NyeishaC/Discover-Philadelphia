import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const dishPhotosTable = pgTable("dish_photos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  caption: varchar("caption", { length: 500 }),
  imageData: text("image_data").notNull(),
  mimeType: varchar("mime_type", { length: 32 }).notNull(),
  inspectorNote: text("inspector_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDishPhotoSchema = createInsertSchema(dishPhotosTable).omit({
  id: true,
  createdAt: true,
  inspectorNote: true,
});

export type InsertDishPhoto = z.infer<typeof insertDishPhotoSchema>;
export type DishPhotoRecord = typeof dishPhotosTable.$inferSelect;
