import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import localFont from "next/font/local"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import Script from "next/script"
import { FavoritesProvider } from "@/hooks/use-favorites"
import PwaRegister from "./components/PwaRegister"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
})

const sagite = localFont({
  src: "../public/fonts/Sagite-woo8x.woff",
  display: "swap",
  variable: "--font-sagite",
})

const aspekta = localFont({
  src: "../public/fonts/AspektaVF.woff2",
  display: "swap",
  variable: "--font-aspekta",
})

export const metadata: Metadata = {
  title: "Minimalist Wallpapers",
  description: "A curated collection of minimalist wallpapers",
  applicationName: "WallWidgy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WallWidgy",
  },
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png",
    shortcut: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png",
    apple: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%209-FXJqPudT39uGWT8Y4IRaSKavP2D0Fj.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://wallwidgy.xyz')
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#0A0A0A",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#ffffff",
        },
        elements: {
          formButtonPrimary: "bg-white text-black hover:bg-white/90",
          card: "bg-[#0A0A0A] border border-white/10",
          headerTitle: "text-white",
          headerSubtitle: "text-white/60",
          socialButtonsBlockButton: "bg-[#1a1a1a] border border-white/10 text-white hover:bg-[#252525]",
          formFieldLabel: "text-white/80",
          formFieldInput: "bg-[#1a1a1a] border-white/10 text-white",
          footerActionLink: "text-white hover:text-white/80",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-white/60 hover:text-white",
        }
      }}
    >
      <html lang="en" className={`${outfit.variable} ${sagite.variable} ${aspekta.variable}`} suppressHydrationWarning>
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
          <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
          <link rel="preconnect" href="https://gist.githubusercontent.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://gist.githubusercontent.com" />
          <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
          <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        </head>
        <body className={`bg-[#0A0A0A] text-white antialiased ${outfit.variable} ${sagite.variable} font-sans`}>
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id="53a87321-3bfb-4340-86b1-e5b44aa7ba2c"
            strategy="afterInteractive"
          />
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
          <PwaRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}

