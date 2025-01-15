import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-gray-800 p-4">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold">
          Minimalist Wallpapers
        </Link>
        <Link href="/admin" className="text-sm bg-gray-700 px-3 py-1 rounded">
          Admin
        </Link>
      </nav>
    </header>
  )
}

