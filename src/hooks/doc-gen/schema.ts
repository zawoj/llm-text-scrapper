import { z } from 'zod'

// Define the schema for websites
export const websitesSchema = z.object({
  id: z.number().optional(),
  url: z.string().url('Nieprawidłowy adres URL').nonempty(),
  doc_url: z.string().optional(),
  lastmod: z.string().optional(), // You can use z.date() if you want to enforce date objects
  changefreq: z.string().optional(),
  priority: z.string().optional(),
  createdAt: z.string().optional(), // Use z.date() for date objects
  updatedAt: z.string().optional(), // Use z.date() for date objects
})

// Define the schema for website subpages
export const websiteSubpagesSchema = z.object({
  id: z.number().optional(),
  website_id: z.number().nonnegative(),
  url: z.string().url('Nieprawidłowy adres URL').nonempty(),
  changefreq: z.string().optional(),
  priority: z.string().optional(),
  createdAt: z.string().optional(), // Use z.date() for date objects
  updatedAt: z.string().optional(), // Use z.date() for date objects
})

// Zod schemas for validation
export const sitemapGeneratorInputSchema = z.object({
  url: z.string().url('Nieprawidłowy adres URL'),
})

export const docGenInputSchema = z.object({
  url: z.string().url('Nieprawidłowy adres URL'),
})
