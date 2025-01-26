import Link from "next/link"

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">API Documentation</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Random Wallpapers API</h2>
          <p className="mb-4">
            This API allows you to fetch random wallpapers from our collection. You can specify the number of
            wallpapers, filter by tag, and set a specific resolution for the preview images.
          </p>

          <h3 className="text-xl font-semibold mb-2">Endpoint</h3>
          <code className="block bg-gray-800 p-2 rounded mb-4">GET https://www.wallwidgy.me/api/random-wallpapers</code>

          <h3 className="text-xl font-semibold mb-2">Query Parameters</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>count</strong> (optional): Number of wallpapers to return. Default is 1.
            </li>
            <li>
              <strong>tag</strong> (optional): Filter wallpapers by tag.
            </li>
            <li>
              <strong>resolution</strong> (optional): Set the resolution for preview images (e.g., "1920x1080").
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Example Usage</h3>
          <code className="block bg-gray-800 p-2 rounded mb-4">
            GET https://www.wallwidgy.me/api/random-wallpapers?count=3&tag=nature&resolution=1920x1080
          </code>

          <h3 className="text-xl font-semibold mb-2">Response</h3>
          <p className="mb-2">The API returns an array of wallpaper objects with the following properties:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>public_id</strong>: Unique identifier for the wallpaper
            </li>
            <li>
              <strong>name</strong>: Filename of the wallpaper
            </li>
            <li>
              <strong>width</strong>: Original width of the wallpaper
            </li>
            <li>
              <strong>height</strong>: Original height of the wallpaper
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

        <Link href="/" className="text-blue-400 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

