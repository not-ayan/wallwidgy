import { Metadata } from "next"
import ProfileClient from "./ProfileClient"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your curated digital canvases, phone setups, and personal collection on WallWidgy.",
}

export default function ProfilePage() {
  return <ProfileClient />
}

