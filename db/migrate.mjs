// Database migrations, applied automatically when the app starts (see instrumentation.ts).
// Can also be run by hand:  node --env-file=.env.local db/migrate.mjs
//
// Rules:
// - Never edit or reorder a migration that has been released; add a new one at the end.
// - Each migration runs once, inside a transaction, and is recorded in `schema_migrations`.
// - db/schema.sql shows the full, current schema for reference.
import { pathToFileURL } from 'node:url'
import pg from 'pg'

export const MIGRATIONS = [
  {
    id: 1,
    name: 'initial schema',
    // Same as the original db/schema.sql. "if not exists" makes it a no-op on databases created by hand.
    sql: `
      create table if not exists uploaded_files (
        id          uuid primary key default gen_random_uuid(),
        created_at  timestamptz not null default now(),
        file_name   text not null,
        mime_type   text not null check (mime_type in (
                      'application/pdf',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
        size_bytes  integer not null check (size_bytes > 0 and size_bytes <= 10485760),
        data        bytea not null
      );

      create table if not exists employer_requirements (
        id              uuid primary key default gen_random_uuid(),
        created_at      timestamptz not null default now(),
        company_name    text not null,
        contact_person  text not null,
        email           text not null,
        phone           text not null,
        role_title      text not null,
        sector          text not null check (sector in ('IT', 'Non-IT', 'Leadership')),
        target_location text not null,
        urgency         text not null check (urgency in ('Immediate', '15-30 Days', 'Pipeline')),
        jd_file_id      uuid references uploaded_files(id) on delete set null,
        notes           text,
        admin_notes     text,
        status          text not null default 'New'
                        check (status in ('New', 'Contacted', 'In Progress', 'Filled', 'Archived'))
      );
      create index if not exists employer_requirements_created_at_idx on employer_requirements (created_at desc);
      create index if not exists employer_requirements_status_idx on employer_requirements (status);

      create table if not exists candidate_applications (
        id                    uuid primary key default gen_random_uuid(),
        created_at            timestamptz not null default now(),
        full_name             text not null,
        email                 text not null,
        phone                 text not null,
        target_role           text not null,
        experience_years      text not null,
        notice_period         text not null,
        relocation_preference text not null,
        passport_status       text not null,
        linkedin_url          text,
        resume_file_id        uuid not null references uploaded_files(id),
        admin_notes           text,
        status                text not null default 'Pending'
                              check (status in ('Pending', 'Reviewed', 'Shortlisted', 'Interviewing', 'Rejected'))
      );
      create index if not exists candidate_applications_created_at_idx on candidate_applications (created_at desc);
      create index if not exists candidate_applications_status_idx on candidate_applications (status);
    `,
  },
  {
    id: 2,
    name: 'candidate CTC, employer openings and level',
    // New columns are nullable so records submitted before this change stay valid.
    sql: `
      alter table candidate_applications add column if not exists current_ctc_lpa  numeric(6,2) check (current_ctc_lpa  >= 0 and current_ctc_lpa  <= 9999);
      alter table candidate_applications add column if not exists expected_ctc_lpa numeric(6,2) check (expected_ctc_lpa >= 0 and expected_ctc_lpa <= 9999);
      alter table employer_requirements  add column if not exists openings integer check (openings between 1 and 9999);
      alter table employer_requirements  add column if not exists level text check (level in ('Entry', 'Mid', 'Senior'));
    `,
  },
]

/** Connection settings shared with lib/db.ts. */
export function connectionConfig() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set.')
  return {
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  }
}

// Arbitrary constant: only one app instance migrates at a time (pm2 cluster, several servers).
const LOCK_ID = 734_101_2026

/** Applies every pending migration. Returns the names of the ones it applied. */
export async function runMigrations({ log = console } = {}) {
  const client = new pg.Client(connectionConfig())
  await client.connect()
  const applied = []
  try {
    await client.query('select pg_advisory_lock($1)', [LOCK_ID])
    await client.query(`create table if not exists schema_migrations (
      id integer primary key,
      name text not null,
      applied_at timestamptz not null default now()
    )`)
    const { rows } = await client.query('select id from schema_migrations')
    const done = new Set(rows.map((r) => r.id))

    for (const migration of MIGRATIONS) {
      if (done.has(migration.id)) continue
      try {
        await client.query('begin')
        await client.query(migration.sql)
        await client.query('insert into schema_migrations (id, name) values ($1, $2)', [migration.id, migration.name])
        await client.query('commit')
        applied.push(migration.name)
        log.info(`[db] applied migration ${migration.id}: ${migration.name}`)
      } catch (error) {
        await client.query('rollback').catch(() => undefined)
        if (error && error.code === '42501') {
          // insufficient_privilege: usually the tables are owned by another database user.
          log.error(`[db] migration ${migration.id} failed: the app's database user may not own the tables. ` +
            'Fix once with (as the postgres superuser): ALTER TABLE <table> OWNER TO <app user>; for each table, then restart the app.')
        }
        throw error
      }
    }
    return applied
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined)
    await client.end().catch(() => undefined)
  }
}

// `node db/migrate.mjs` runs the migrations directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
    .then((applied) => { console.log(applied.length ? `Applied ${applied.length} migration(s).` : 'Database is up to date.'); process.exit(0) })
    .catch((error) => { console.error(error); process.exit(1) })
}
