import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Latest Wallpapers",
  description: "Browse the newest minimalist wallpapers and aesthetic digital canvases on WallWidgy.",
}

export default function LatestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
