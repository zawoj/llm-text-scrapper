# LLM Text Scrapper

Aplikacja do generowania dokumentacji i scrapowania danych ze stron internetowych, wykorzystująca bazę danych PostgreSQL z Vercel i Drizzle ORM.

## Konfiguracja Drizzle ORM

Projekt używa Drizzle ORM do interakcji z bazą danych PostgreSQL. Poniżej znajdują się instrukcje, jak skonfigurować i korzystać z Drizzle w tym projekcie.

### Instalacja potrzebnych pakietów

```bash
# Instalacja Drizzle ORM i narzędzi
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit dotenv-cli

# Jeśli używasz innych walidatorów/narzędzi
npm install drizzle-zod zod
```

### Inicjalizacja i migracje bazy danych

1. **Generowanie migracji na podstawie schematu**

```bash
# Użyj Drizzle Kit do wygenerowania plików migracji
npx drizzle-kit generate
```

2. **Zastosowanie migracji**

```bash
# Metoda 1: Użyj Drizzle Kit do bezpośredniego aktualizowania bazy danych
npx drizzle-kit push

# Metoda 2: Użyj skryptu migracji z projektu
node -r dotenv/config src/db/migrate.ts
```

3. **Studio Drizzle**

```bash
# Uruchom Drizzle Studio, aby przeglądać i zarządzać danymi
npx drizzle-kit studio
```

## Struktura bazy danych

Projekt zawiera następujące tabele:

- `websites` - informacje o stronach do scrapowania
- `website_subpages` - informacje o podstronach stron głównych

## Zmienne środowiskowe

Upewnij się, że masz plik `.env` z następującymi zmiennymi:

```
POSTGRES_URL="postgresql://username:password@host:port/database"
```

## Zaawansowane użycie

Zobacz dokumentację [Drizzle ORM](https://orm.drizzle.team/) aby dowiedzieć się więcej o zaawansowanych funkcjach i optymalizacji.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Deno Version

This project also includes a Deno version of the sitemap generator. To run it:

```bash
deno run --allow-net --allow-read --allow-write test.ts
# or use the task defined in deno.json
deno task run
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
