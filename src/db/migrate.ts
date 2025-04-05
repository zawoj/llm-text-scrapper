import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { poolDb } from './index';

// This script will create the tables in your database based on your schema
async function main() {
  console.log('Migracja bazy danych rozpoczęta...');
  
  try {
    // This will automatically create the tables if they don't exist
    await migrate(poolDb, { migrationsFolder: 'drizzle' });
    console.log('Migracja zakończona pomyślnie!');
  } catch (error) {
    console.error('Błąd podczas migracji:', error);
    process.exit(1);
  }
}

main();
