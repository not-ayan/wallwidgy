"use client"

import React, { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Header from "../components/Header"
import InteractiveSearch from "../components/InteractiveSearch"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""

  const handleQueryChange = (newQuery: string) => {
    if (newQuery.trim()) {
      router.replace(`/search?q=${encodeURIComponent(newQuery.trim())}`, { scroll: false })
    } else {
      router.replace("/search", { scroll: false })
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-aspekta selection:bg-white selection:text-black antialiased flex flex-col justify-between">
      <Header showBackButton={true} backUrl="/" />

      <main className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col items-center">
        {/* Ambient backdrop glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Interactive Bar Search Container */}
        <div className="w-full flex justify-center">
          <InteractiveSearch
            mode="embedded"
            initialQuery={initialQuery}
            onQueryChange={handleQueryChange}
          />
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
