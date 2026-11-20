import type { Metadata } from "next"

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username || "")

  return {
    title: cleanUsername ? `${cleanUsername}'s Profile` : "Curator Profile",
    description: `Explore ${cleanUsername}'s curated wallpaper collection, phone setups, and favorite digital canvases on WallWidgy.`,
  }
}

export default function SharedProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
