import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { SITE } from '@/lib/site'

// DRAFT wording – have the client (and ideally their legal adviser) review before the site goes live.
const LAST_UPDATED = '25 November 2026'

export const metadata: Metadata = {
  title: 'Privacy Policy | A3A Staffing Solutions',
  description: 'How A3A Staffing Solutions collects, uses and protects the personal data shared through this website.',
  alternates: { canonical: '/privacy' },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-[-.02em] text-[#061b3d]">{title}</h2>
      <div className="mt-3 space-y-3 leading-7">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-600">
      <header className="border-b-2 border-brand-400 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <BrandLogo href="/" />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-800"><ArrowLeft className="size-4" /> Back to site</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-navy-600">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-[#061b3d]">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-8 leading-7">
          {SITE.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a recruitment and staffing firm. This policy explains what personal data we collect
          through this website, why we collect it, and the choices you have. It is written with India&rsquo;s Digital Personal Data Protection
          Act, 2023 in mind.
        </p>

        <Section title="What we collect">
          <p><strong className="text-[#061b3d]">Job seekers:</strong> your name, email, phone number, target role, years of experience, notice period,
            relocation preference, passport status, LinkedIn profile (optional) and the resume you upload.</p>
          <p><strong className="text-[#061b3d]">Employers:</strong> company name, contact person, work email, phone number, details of the role you are
            hiring for, any notes you add and the job description you upload (optional).</p>
          <p>We do not use advertising or tracking cookies on this website.</p>
        </Section>

        <Section title="Why we use it">
          <ul className="list-disc space-y-2 pl-5">
            <li>To match job seekers with suitable roles and contact them about opportunities.</li>
            <li>To understand an employer&rsquo;s hiring needs and respond to their requirement.</li>
            <li>With a job seeker&rsquo;s agreement, to share their profile with a prospective employer for a specific role.</li>
          </ul>
          <p>We do not sell your personal data, and we do not use it for unrelated marketing.</p>
        </Section>

        <Section title="Your consent">
          <p>We process the data you submit on the basis of the consent you give when you send a form. You can withdraw that consent at any time by
            writing to us (see &ldquo;Contact&rdquo; below); we will then stop using your data and delete it, unless the law requires us to keep it.</p>
        </Section>

        <Section title="How we store and protect it">
          <p>Submissions and uploaded files are stored in a secured database that only authorised A3A staff can access through a password-protected
            console. Files are never publicly reachable.</p>
          <p>We keep job-seeker profiles for as long as they are useful for matching you with roles, and for no longer than 24 months after your last
            contact with us. Employer enquiries are kept for as long as the business relationship needs them.</p>
        </Section>

        <Section title="Your rights">
          <p>You can ask us to access, correct, update or delete your personal data, or to stop using it. You may also nominate another person to
            exercise these rights on your behalf. If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>
        </Section>

        <Section title="Contact">
          <p>For any privacy question or request, contact {SITE.founder} at{' '}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-navy-600 underline underline-offset-4">{SITE.email}</a> or{' '}
            <a href={SITE.phoneHref} className="font-semibold text-navy-600 underline underline-offset-4">{SITE.phone}</a>.
            We aim to respond within 30 days.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
        </Section>
      </article>
    </main>
  )
}
