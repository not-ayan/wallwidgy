import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata = {
  title: 'Minimalist Wallpapers',
  description: 'A curated collection of minimalist wallpapers',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="bg-[#0A0A0A] text-white antialiased font-outfit">{children}</body>
    </html>
  )
}

