import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Android App",
  description: "Download the native WallWidgy Android app for high-resolution minimalist wallpapers and automations.",
}

export default function AndroidLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
