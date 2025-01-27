import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 sm:p-8 font-outfit">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md">
        <header className="px-4 sm:px-8 py-5">
          <nav className="flex justify-between items-center max-w-[1400px] mx-auto">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </nav>
        </header>
      </div>
      <div className="max-w-3xl mx-auto pt-24 sm:pt-28">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center font-outfit text-[#F7F06D]">
          API Documentation
        </h1>

        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 font-outfit text-[#F7F06D]">Random Wallpapers API</h2>
          <p className="mb-4 text-white/70">
            This API allows you to fetch random wallpapers from our collection. You can specify the number of
            wallpapers, filter by tag, and set a specific resolution for the wallpapers.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold mb-2 font-outfit text-[#F7F06D]">Endpoint</h3>
          <code className="block bg-black p-3 rounded mb-4 text-sm sm:text-base overflow-x-auto">
            GET https://www.wallwidgy.me/api/random-wallpapers
          </code>

          <h3 className="text-lg sm:text-xl font-semibold mb-2 font-outfit text-[#F7F06D]">Query Parameters</h3>
          <ul className="list-disc pl-6 mb-4 text-white/70">
            <li>
              <strong>count</strong> (optional): Number of wallpapers to return. Default is 1.
            </li>
            <li>
              <strong>tag</strong> (optional): Filter wallpapers by tag. Accepted values: "desktop" or "mobile".
            </li>
            <li>
              <strong>resolution</strong> (optional): Filter wallpapers by resolution. Accepted values: "1080p",
              "1440p", "4k", "8k".
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold mb-2 font-outfit text-[#F7F06D]">Example Usage</h3>
          <code className="block bg-black p-3 rounded mb-4 text-sm sm:text-base overflow-x-auto">
            GET https://www.wallwidgy.me/api/random-wallpapers?count=3&tag=desktop&resolution=4k
          </code>

          <h3 className="text-lg sm:text-xl font-semibold mb-2 font-outfit text-[#F7F06D]">Response</h3>
          <p className="mb-2 text-white/70">
            The API returns an array of wallpaper objects with the following properties:
          </p>
          <ul className="list-disc pl-6 mb-4 text-white/70">
            <li>
              <strong>public_id</strong>: Unique identifier for the wallpaper
            </li>
            <li>
              <strong>name</strong>: Filename of the wallpaper
            </li>
            <li>
              <strong>width</strong>: Width of the wallpaper
            </li>
            <li>
              <strong>height</strong>: Height of the wallpaper
            </li>
            <li>
              <strong>format</strong>: File format of the wallpaper
            </li>
            <li>
              <strong>created_at</strong>: Creation date of the wallpaper
            </li>
            <li>
              <strong>tags</strong>: Array of tags associated with the wallpaper
            </li>
            <li>
              <strong>colors</strong>: Array of colors present in the wallpaper
            </li>
            <li>
              <strong>preview_url</strong>: URL for the preview image
            </li>
            <li>
              <strong>download_url</strong>: URL for downloading the full-resolution wallpaper
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

