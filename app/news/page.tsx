'use client'

import Link from "next/link"
import { useState } from "react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

interface Feature {
  name: string
  detail: string
}

interface Release {
  version: string
  date: string
  title: string
  badge: string
  description: string
  features: Feature[]
}

const RELEASES: Release[] = [
  {
    version: "v2.5",
    date: "June 2026",
    title: "Grid Redesign & Core Optimizations",
    badge: "Current",
    description: "A major update featuring integrated layout filters, an overhauled search interface, client-side notifications, and significant build optimizations including purging unused codebase assets and tuning middleware matchers.",
    features: [
      { name: "Redesigned Grid", detail: "Integrated category filters directly into the main grid and restructured navigation headers." },
      { name: "Search Overhaul", detail: "Completely redesigned search bar interface with improved responsive dialog animations." },
      { name: "SEO & ISR Routing", detail: "Integrated dynamic sitemaps and robots settings, re-routing detail pages to Incremental Static Regeneration." },
      { name: "Performance Purge", detail: "Purged unused UI elements, tuned middleware matchers, and enabled Cloudflare Pages optimization." },
      { name: "Notification Center", detail: "Added client-side notification bell dropdown and on-screen Toast alerts." }
    ]
  },
  {
    version: "v2.1",
    date: "February 2026",
    title: "Cloud Sync & User Accounts",
    badge: "Stable",
    description: "Introduced secure user accounts to enable cloud-synchronized favorites across devices. Keeps your curated list of minimal wallpapers backed up and synced.",
    features: [
      { name: "User Authentication", detail: "Frictionless login via Clerk with email or social provider integration." },
      { name: "Cloud Favorites", detail: "Sync and backup your favorite wallpapers securely to cloud database tables." }
    ]
  },
  {
    version: "v2.0",
    date: "October 2025",
    title: "AI Recommendation Engine",
    badge: "Milestone",
    description: "Features AI-powered wallpaper suggestions based on visual style and color palettes, paired with real-time query filtering.",
    features: [
      { name: "Similar Wallpapers", detail: "Context-aware similarity algorithms running on color signatures and orientation." },
      { name: "Advanced Search", detail: "Real-time query filtering with responsive desktop/mobile toggle triggers." },
      { name: "Speed Tuning", detail: "Re-routed assets through global CDN nodes to lower content load times." }
    ]
  }
]

export default function NewsPage() {
  const [activeVersion, setActiveVersion] = useState<string>("v2.5")
  const selectedRelease = RELEASES.find((r) => r.version === activeVersion) || RELEASES[0]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-aspekta selection:bg-white selection:text-black antialiased flex flex-col justify-between">
      {/* Universal Consistent Site Header */}
      <Header showBackButton={true} backUrl="/" />

      <main className="pt-28 sm:pt-32 pb-24 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Editorial Headline */}
          <div className="text-left sm:text-center pb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#EDEDED] leading-[1.1] mb-6">
              Documenting the search for quiet screens
            </h1>

            {/* Lead Narrative */}
            <p className="text-base sm:text-lg text-[#8E8E8E] font-normal leading-relaxed mb-4 max-w-2xl mx-auto">
              WallWidgy is a minimal wallpaper catalog built by hand. A calm collection of desktop and mobile canvases assembled from remote storage assets, custom API indexes, and responsive layouts.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#EDEDED] mb-8">
              This journal records the releases, engineering, and platform feeds.
            </p>
          </div>

          {/* Subtle Hairline Divider */}
          <div className="border-t border-white/[0.08] my-12" />

          {/* Section 01: Releases */}
          <section className="space-y-6">
            <span className="text-xs font-mono text-[#555555] block">01</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              The release journal
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Every iteration focuses on performance, search precision, and removing visual noise.
            </p>

            {/* Version Selector Tabs */}
            <div className="flex items-center gap-2 pt-2">
              {RELEASES.map((rel) => (
                <button
                  key={rel.version}
                  onClick={() => setActiveVersion(rel.version)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeVersion === rel.version
                      ? "bg-[#EDEDED] text-[#0A0A0A] font-semibold"
                      : "bg-white/[0.04] text-[#737370] hover:text-[#EDEDED] hover:bg-white/[0.08] border border-white/[0.05]"
                  }`}
                >
                  {rel.version}
                </button>
              ))}
            </div>

            {/* Active Release Card */}
            <div className="p-6 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-lg font-medium text-[#EDEDED]">
                  {selectedRelease.title}
                </h3>
                <span className="text-xs font-mono text-[#666666]">
                  {selectedRelease.date}
                </span>
              </div>

              <p className="text-sm text-[#8E8E8E] leading-relaxed">
                {selectedRelease.description}
              </p>

              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#555555] block">
                  Deliverables
                </span>
                <ul className="divide-y divide-white/[0.06] text-xs">
                  {selectedRelease.features.map((feat, i) => (
                    <li key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                      <span className="font-medium text-[#EDEDED] sm:w-40 shrink-0">
                        {feat.name}
                      </span>
                      <span className="text-[#8E8E8E] leading-relaxed">
                        {feat.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 02: Architecture */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">02</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              System architecture
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Built for speed and zero unnecessary dependencies. Assets are served directly through distributed edge nodes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Framework</span>
                <span className="text-sm font-medium text-[#EDEDED] mt-1 block">Next.js 16</span>
                <span className="text-xs text-[#8E8E8E] mt-0.5 block">App router &amp; ISR</span>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Delivery</span>
                <span className="text-sm font-medium text-[#EDEDED] mt-1 block">GitHub CDN</span>
                <span className="text-xs text-[#8E8E8E] mt-0.5 block">Global edge caching</span>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Accounts</span>
                <span className="text-sm font-medium text-[#EDEDED] mt-1 block">Clerk Cloud</span>
                <span className="text-xs text-[#8E8E8E] mt-0.5 block">Metadata sync</span>
              </div>
            </div>
          </section>

          {/* Section 03: Station API */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">03</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Station API &amp; feeds
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              WallWidgy exposes unauthenticated REST endpoints for external scripts, desktop widgets, and custom automations.
            </p>

            <div className="rounded-xl bg-[#080808] text-[#E0E0E0] border border-white/[0.08] p-4 font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-white/40 text-[10px]"># Fetch random minimalist wallpapers</div>
              <div>curl https://wallwidgy.app/api/random</div>
              <div className="text-white/40 text-[10px] pt-2"># Fetch complete catalog index</div>
              <div>curl https://wallwidgy.app/api/wallpapers/index</div>
            </div>

            <div className="pt-2">
              <Link
                href="/api"
                className="text-sm font-medium text-[#EDEDED] underline underline-offset-4 decoration-white/25 hover:decoration-white transition-colors"
              >
                Read the full API specification &rarr;
              </Link>
            </div>
          </section>

          {/* Colophon */}
          <div className="mt-24 pt-12 border-t border-white/[0.08] flex flex-col sm:flex-row items-baseline justify-between gap-4 text-xs text-[#666666]">
            <div>
              Designed &amp; built by{" "}
              <a
                href="https://github.com/not-ayan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EDEDED] underline underline-offset-2 hover:opacity-80"
              >
                Ayan Biswas
              </a>
              .
            </div>
            <div className="font-mono">
              WallWidgy &bull; 2026
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}