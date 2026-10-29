# A3A Staffing Solutions

Next.js 16 (App Router) site with employer/candidate intake forms and a private admin console at `/admin`.
All data, including uploaded resumes and JDs, is stored in PostgreSQL.

## Setup

1. Create a PostgreSQL database (version 13 or newer), for example:
   ```sql
   create database a3a_staffing;
   create user a3a_app with password 'choose-a-strong-password';
   grant all privileges on database a3a_staffing to a3a_app;
   -- on PostgreSQL 15+ also run, while connected to a3a_staffing:
   grant all on schema public to a3a_app;
   ```
2. Create the tables:
   ```bash
   psql "postgres://a3a_app:PASSWORD@localhost:5432/a3a_staffing" -f db/schema.sql
   ```
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
   For a hosted database that requires TLS, set `DATABASE_SSL=true`.
4. `pnpm install` then `pnpm dev`, and open http://localhost:3000 and http://localhost:3000/admin.

## How it works

| Piece | Location |
| --- | --- |
| Schema | `db/schema.sql` (`employer_requirements`, `candidate_applications`, `uploaded_files`) |
| DB connection | `lib/db.ts` (pooled `pg` client, transactions) |
| Public forms | `components/enquiry-hub.tsx` |
| Submission APIs | `app/api/submit-employer`, `app/api/submit-candidate` (multipart, zod validation, PDF/DOCX content check, 10MB max, honeypot) |
| Admin auth | `app/api/admin/login` sets an HMAC-signed, httpOnly session cookie (12h) |
| Admin data | `app/api/admin/records` (GET list, PATCH status / append note) |
| File access | `app/api/admin/file?kind=&id=` serves the stored file to signed-in admins only |
| Dashboard UI | `components/admin/admin-dashboard.tsx` |

Notes:
- Uploaded files live in the `uploaded_files` table (`bytea`). Records point to them through `jd_file_id` / `resume_file_id`.
  A file and its record are saved in one transaction, so a failed submission never leaves a stray file behind.
- Admin notes are append-only and timestamped, shown as a history in the detail drawer.
- Storing files in the database keeps everything in one place. Each resume adds roughly its file size to the database, so plan disk space accordingly.
- Vercel serverless functions cap request bodies at about 4.5MB, so larger uploads fail there. A regular Node server (`pnpm build && pnpm start`) has no such limit.
