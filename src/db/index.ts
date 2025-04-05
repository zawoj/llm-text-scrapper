import { sql, createPool } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

// Importuj schematy z różnych modułów
import * as docGenSchema from '../hooks/doc-gen/schema';
// Możesz dodać więcej schematów w przyszłości, np:
// import * as userSchema from '../hooks/user/schema';
// import * as productSchema from '../hooks/product/schema';

// Połącz wszystkie schematy w jeden obiekt
export const schema = {
  ...docGenSchema,
  // ...userSchema,
  // ...productSchema,
};

// ===== Metoda 1: Połączenie serverless (zalecane dla API Routes) =====
// Używa pojedynczego połączenia SQL, idealne dla funkcji serverless
export const db = drizzle(sql, { schema });

// ===== Metoda 2: Połączenie przez pulę (zalecane dla długotrwałych operacji) =====
// Tworzy pulę połączeń, lepsze dla długotrwałych operacji lub wielu równoczesnych zapytań
export const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});
export const poolDb = drizzle(pool, { schema });

// Eksportuj wszystkie schematy, aby były dostępne przy imporcie z tego modułu
export * from '../hooks/doc-gen/schema';
// export * from '../hooks/user/schema';
// export * from '../hooks/product/schema';
