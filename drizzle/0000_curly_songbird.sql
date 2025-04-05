CREATE TABLE "website_subpages" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"url" text NOT NULL,
	"changefreq" text,
	"priority" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"doc_url" text,
	"lastmod" timestamp,
	"changefreq" text,
	"priority" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "website_subpages" ADD CONSTRAINT "website_subpages_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE no action ON UPDATE no action;