-- A3A Staffing Solutions — PostgreSQL schema (PostgreSQL 13+)
-- Apply with:  psql "$DATABASE_URL" -f db/schema.sql
-- Safe to re-run: every statement is idempotent.

-- ─────────────────────────────────────────────────────────────
-- Uploaded files (JDs and resumes), stored in the database itself.
-- Only reachable through the authenticated admin console.
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Employer hiring requirements
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Candidate applications
-- ─────────────────────────────────────────────────────────────
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
