import { z } from "zod";
import { BACKGROUND_STYLE_IDS, DEFAULT_BACKGROUND_STYLE } from "../theme/backgrounds";

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .optional();

const tagsSchema = z.array(z.string().trim().min(1).max(32)).max(16).default([]);

export const loginSchema = z.object({
  password: z.string().min(1).max(256),
});

export const categorySchema = z.object({
  id: idSchema,
  nameZh: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
  icon: z.string().trim().min(1).max(48).default("Folder"),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#00f5ff"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const linkSchema = z.object({
  id: idSchema,
  categoryId: z.string().trim().max(96).nullable().default(null),
  title: z.string().trim().min(1).max(120),
  descriptionZh: z.string().trim().max(280).default(""),
  descriptionEn: z.string().trim().max(280).default(""),
  url: z.string().trim().url().max(512),
  iconUrl: z.string().trim().max(512).default(""),
  tags: tagsSchema,
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const searchEngineSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  urlTemplate: z.string().trim().min(8).max(512).includes("{query}"),
  shortcut: z.string().trim().max(16).default(""),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const settingsSchema = z.object({
  titleZh: z.string().trim().min(1).max(80),
  titleEn: z.string().trim().min(1).max(80),
  subtitleZh: z.string().trim().max(180),
  subtitleEn: z.string().trim().max(180),
  defaultLocale: z.enum(["zh", "en"]),
  defaultTheme: z.enum(["system", "light", "dark"]),
  backgroundStyle: z.enum(BACKGROUND_STYLE_IDS).default(DEFAULT_BACKGROUND_STYLE),
});

export const importSchema = z.object({
  settings: settingsSchema.optional(),
  categories: z.array(categorySchema.required({ id: true })).optional(),
  links: z.array(linkSchema.required({ id: true })).optional(),
  searchEngines: z.array(searchEngineSchema.required({ id: true })).optional(),
});

export const reorderLinksSchema = z.object({
  categoryId: z.string().trim().max(96).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(64).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type LinkInput = z.infer<typeof linkSchema>;
export type SearchEngineInput = z.infer<typeof searchEngineSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ImportInput = z.infer<typeof importSchema>;
export type ReorderLinksInput = z.infer<typeof reorderLinksSchema>;
