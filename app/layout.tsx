import './globals.css'
import type { Metadata } from 'next'
import SliceraFooter from '@/components/SliceraFooter';

export const metadata: Metadata = {
  title: 'WISeReady',
  description: 'Quickly check Medicare WISeR prior authorization requirements',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-196x196.png', sizes: '196x196', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">WISeReady</h1>
            <p className="text-sm text-neutral-500">
              Check whether a Medicare procedure requires prior authorization under the WISeR pilot and get a documentation checklist.
            </p>
          </header>
          {children}
          <footer className="mt-16 text-xs text-neutral-500">
            <p>Informational tool only. Verify against current CMS and your MAC.</p>
          </footer>
          <SliceraFooter logoSrc="/assets/white_logo.svg" />
        </div>
      </body>
    </html>
  )
}
