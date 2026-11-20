import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Developer API endpoints and integration guides for the WallWidgy wallpaper ecosystem.",
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
