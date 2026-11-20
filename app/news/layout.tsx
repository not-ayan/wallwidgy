import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Journal & Changelog",
  description: "Release notes, changelogs, and technical updates from the WallWidgy studio.",
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
