import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Website documentation generation table
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  doc_url: text('doc_url'),
  lastmod: text('lastmod'),
  changefreq: text('changefreq'),
  priority: text('priority'),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`)
});

// Website subpages table
export const websiteSubpages = pgTable('website_subpages', {
  id: serial('id').primaryKey(),
  website_id: integer('website_id').notNull().references(() => websites.id),
  url: text('url').notNull(),
  lastmod: text('lastmod'),
  changefreq: text('changefreq'),
  priority: text('priority'),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`)
});

// Zod schemas for validation
export const websitesInsertSchema = createInsertSchema(websites);
export const websitesSelectSchema = createSelectSchema(websites);

export const websiteSubpagesInsertSchema = createInsertSchema(websiteSubpages);
export const websiteSubpagesSelectSchema = createSelectSchema(websiteSubpages);

// Types
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;

export type WebsiteSubpage = typeof websiteSubpages.$inferSelect;
export type NewWebsiteSubpage = typeof websiteSubpages.$inferInsert;

// Walidator dla endpointu sitemap-gen
export const sitemapGeneratorInputSchema = z.object({
  url: z.string().url("Nieprawidłowy adres URL"),
})

// Walidator dla endpointu doc-gen
export const docGenInputSchema = z.object({
  url: z.string().url("Nieprawidłowy adres URL"),
})
