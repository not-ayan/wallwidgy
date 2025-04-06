import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-gray-800 p-4">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold">
          Minimalist Wallpapers
        </Link>
      </nav>
    </header>
  )
}

