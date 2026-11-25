import { DM_Sans, Space_Grotesk } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { CleanAnchorLinks } from '@/components/clean-anchor-links'
import { StructuredData } from '@/components/structured-data'
import { INDEXABLE, SITE } from '@/lib/site'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'A3A Staffing Solutions | Strategic Talent Acquisition Partner',
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  alternates: { canonical: '/' },
  // "noindex" until the live https domain is configured (see INDEXABLE in lib/site.ts).
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  keywords: [
    'recruitment agency', 'best recruitment agency in India', 'placement consultancy', 'best headhunters in India',
    'executive search firm', 'IT recruitment agency', 'non-IT recruitment', 'leadership hiring', 'mid-level hiring',
    'staffing solutions', 'hiring partner for startups and SMEs',
  ],
  openGraph: {
    title: 'A3A Staffing Solutions | Strategic Talent Acquisition Partner',
    description: 'Strategic IT & Non-IT, mid-level and leadership hiring for startups, SMEs and enterprises across India.',
    url: '/',
    siteName: SITE.name,
    locale: 'en_IN',
    type: 'website',
    // The share image comes from app/opengraph-image.tsx.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A3A Staffing Solutions | Strategic Talent Acquisition Partner',
    description: 'Strategic IT & Non-IT, mid-level and leadership hiring for startups, SMEs and enterprises across India.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}>
        <StructuredData />
        {children}
        <Toaster position="top-center" richColors closeButton />
        <CleanAnchorLinks />
      </body>
    </html>
  )
}
