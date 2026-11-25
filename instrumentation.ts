// Runs once when the Next.js server starts (dev, `next start`, pm2 restart).
// Brings the database schema up to date, so deploying new code is enough: no manual SQL.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL is not set; skipping migrations.')
    return
  }
  try {
    const { runMigrations } = await import('./db/migrate.mjs')
    const applied = await runMigrations()
    if (applied.length === 0) console.info('[db] schema is up to date.')
  } catch (error) {
    // The site keeps running (pages still work); forms that need the new columns will fail until this is fixed.
    console.error('[db] migrations failed:', error)
  }
}
