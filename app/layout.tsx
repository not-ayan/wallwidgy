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
    icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png',
    shortcut: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png',
    apple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={`bg-[#0A0A0A] text-white antialiased ${outfit.variable} font-sans`}>{children}</body>
    </html>
  )
}

