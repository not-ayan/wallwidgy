import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your curated wallpaper favorites and personal collection on WallWidgy.",
}

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
