import { Analytics } from '@vercel/analytics/next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { CleanAnchorLinks } from '@/components/clean-anchor-links'
import { SITE } from '@/lib/site'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'A3A Staffing Solutions | Strategic Talent Acquisition Partner',
  description: 'A3A Staffing Solutions helps startups, SMEs, and enterprises hire exceptional IT and Non-IT mid-level and leadership talent across India.',
  metadataBase: new URL(SITE.url),
  alternates: { canonical: '/' },
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
        {children}
        <Toaster position="top-center" richColors closeButton />
        <CleanAnchorLinks />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
