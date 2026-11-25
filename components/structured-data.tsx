import { SITE } from '@/lib/site'

/**
 * Tells Google who the business is (schema.org JSON-LD): name, logo, contact details, founder, services.
 * URLs come from NEXT_PUBLIC_SITE_URL, so they are correct once the live domain is set.
 * When the office address is known, add an `address` (PostalAddress) to the EmploymentAgency below.
 */
export function StructuredData() {
  const org = `${SITE.url}/#organization`
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EmploymentAgency',
        '@id': org,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}${SITE.logoLargeUrl}`,
        image: `${SITE.url}${SITE.logoLargeUrl}`,
        description: SITE.description,
        telephone: SITE.phone.replace(/\s/g, ''),
        email: SITE.email,
        areaServed: { '@type': 'Country', name: 'India' },
        founder: { '@type': 'Person', name: SITE.founder, jobTitle: 'Founder & Principal Talent Consultant', sameAs: [SITE.linkedinUrl] },
        knowsAbout: ['IT recruitment', 'Non-IT recruitment', 'Executive search', 'Leadership hiring', 'Mid-level hiring'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: SITE.phone.replace(/\s/g, ''),
          email: SITE.email,
          areaServed: 'IN',
          availableLanguage: ['English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { '@id': org },
        inLanguage: 'en-IN',
      },
    ],
  }
  // "<" is escaped so the JSON can never close the script tag early.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
