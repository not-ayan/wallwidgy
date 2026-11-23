'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
  download_count: number
}

interface GithubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  assets: ReleaseAsset[]
  body: string
}

const FALLBACK_RELEASE: GithubRelease = {
  tag_name: "v1.5",
  name: "Wallwidgy v1.5 release",
  published_at: "2026-06-20T08:58:06Z",
  html_url: "https://github.com/not-ayan/wallwidgy_android/releases/tag/v1.5",
  assets: [
    {
      name: "Wallwidgy-v1.5-arm64-v8a-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-arm64-v8a-release.apk",
      size: 25923553,
      download_count: 52
    },
    {
      name: "Wallwidgy-v1.5-all-universal-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-all-universal-release.apk",
      size: 61387754,
      download_count: 84
    },
    {
      name: "Wallwidgy-v1.5-armeabi-v7a-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-armeabi-v7a-release.apk",
      size: 22794925,
      download_count: 4
    }
  ],
  body: "Smart Semantic Search (Offline AI)\nAutomated Wallpaper Rotation\nOptimized minimal layout"
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseApkArch(fileName: string) {
  const nameLower = fileName.toLowerCase()
  if (nameLower.includes("arm64-v8a")) {
    return {
      arch: "ARM64-v8a",
      desc: "Modern 64-bit devices (Android 8.0+)",
      recommend: true
    }
  } else if (nameLower.includes("armeabi-v7a")) {
    return {
      arch: "ARMEABI-v7a",
      desc: "Legacy 32-bit devices",
      recommend: false
    }
  } else if (nameLower.includes("universal") || nameLower.includes("all-universal")) {
    return {
      arch: "Universal Package",
      desc: "Compatible with all chipsets",
      recommend: false
    }
  }
  return {
    arch: "Standard Build",
    desc: "Default Android archive",
    recommend: false
  }
}

export default function AndroidPage() {
  const [release, setRelease] = useState<GithubRelease>(FALLBACK_RELEASE)
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(0)

  const screenshots = [
    { url: "/android/Screenshot_20260711-212432_com.notayan.wallwidgy.png", label: "Gallery browse" },
    { url: "/android/Screenshot_20260711-212443_com.notayan.wallwidgy.png", label: "Wallpaper detail" },
    { url: "/android/Screenshot_20260711-212451_com.notayan.wallwidgy.png", label: "Automated rotation" },
    { url: "/android/Screenshot_20260711-212454_com.notayan.wallwidgy.png", label: "Semantic vector search" },
    { url: "/android/Screenshot_20260711-212457_com.notayan.wallwidgy.png", label: "Color extraction" },
    { url: "/android/Screenshot_20260711-212501_com.notayan.wallwidgy.png", label: "Saved favorites" },
    { url: "/android/Screenshot_20260711-212505_com.notayan.wallwidgy.png", label: "Device settings" },
    { url: "/android/Screenshot_20260711-212510_com.notayan.wallwidgy.png", label: "Widescreen adaptation" }
  ]

  useEffect(() => {
    async function fetchRelease() {
      try {
        const response = await fetch("https://api.github.com/repos/not-ayan/wallwidgy_android/releases/latest")
        if (response.ok) {
          const data = await response.json()
          const apkAssets = (data.assets || []).filter((a: any) => a.name?.endsWith(".apk"))
          if (apkAssets.length > 0) {
            setRelease({
              tag_name: data.tag_name || FALLBACK_RELEASE.tag_name,
              name: data.name || FALLBACK_RELEASE.name,
              published_at: data.published_at || FALLBACK_RELEASE.published_at,
              html_url: data.html_url || FALLBACK_RELEASE.html_url,
              assets: apkAssets,
              body: data.body || FALLBACK_RELEASE.body
            })
          }
        }
      } catch (err) {
        console.warn("Could not fetch release from GitHub API, using fallback data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRelease()
  }, [])

  const nextScreenshot = () => {
    setCurrentScreen((prev) => (prev + 1) % screenshots.length)
  }

  const prevScreenshot = () => {
    setCurrentScreen((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-aspekta selection:bg-white selection:text-black antialiased flex flex-col justify-between">
      {/* Universal Consistent Site Header */}
      <Header showBackButton={true} backUrl="/" />

      <main className="pt-28 sm:pt-32 pb-24 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Editorial Headline */}
          <div className="text-left sm:text-center pb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#EDEDED] leading-[1.1] mb-6">
              Carrying the gallery everywhere
            </h1>

            {/* Lead Narrative */}
            <p className="text-base sm:text-lg text-[#8E8E8E] font-normal leading-relaxed mb-4 max-w-2xl mx-auto">
              Take the minimal wallpaper collection to your phone. The native Android client features offline semantic vector search, automated wallpaper scheduling, and clean layouts built specifically for mobile screens.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#EDEDED] mb-8">
              100% free, open source, and built without advertisements.
            </p>
          </div>

          {/* Subtle Hairline Divider */}
          <div className="border-t border-white/[0.08] my-12" />

          {/* Section 01: Install packages */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#555555] block">01</span>
              <span className="text-xs font-mono text-[#8E8E8E] px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                {loading ? "Checking release..." : `Stable ${release.tag_name}`}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Direct install packages
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Choose the APK build for your device architecture. For almost all devices manufactured after 2016, choose ARM64.
            </p>

            {/* Package cards */}
            <div className="space-y-3 pt-2">
              {release.assets.map((asset) => {
                const arch = parseApkArch(asset.name)
                return (
                  <a
                    key={asset.name}
                    href={asset.browser_download_url}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      arch.recommend
                        ? "bg-[#EDEDED] text-[#0A0A0A] border-[#EDEDED] hover:bg-white shadow-sm"
                        : "bg-[#121212] text-[#EDEDED] border-white/[0.08] hover:border-white/20 shadow-sm"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{arch.arch}</span>
                        {arch.recommend && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/15 text-black font-semibold">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${arch.recommend ? "text-black/70" : "text-[#707070]"}`}>
                        {arch.desc} &bull; {formatSize(asset.size)}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs font-medium ${arch.recommend ? "text-black" : "text-[#EDEDED]"}`}>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>

          {/* Section 02: Interface & Screenshots */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">02</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Visual interface
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Browse captures from the native application. Designed with gesture navigation, offline AI search, and automatic rotation.
            </p>

            {/* Minimal Device Frame Carousel */}
            <div className="rounded-2xl bg-[#121212] border border-white/[0.08] p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-mono text-[#8E8E8E]">
                  {screenshots[currentScreen].label}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevScreenshot}
                    className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-[#8E8E8E] hover:text-[#EDEDED] transition-colors"
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[#8E8E8E] min-w-[3rem] text-center">
                    {currentScreen + 1} / {screenshots.length}
                  </span>
                  <button
                    onClick={nextScreenshot}
                    className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-[#8E8E8E] hover:text-[#EDEDED] transition-colors"
                    aria-label="Next screenshot"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Screenshot Display in Device Mockup */}
              <div className="flex justify-center py-6 bg-[#080808] rounded-xl overflow-hidden border border-white/[0.04]">
                <div className="relative max-w-[240px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#1F1F1F] bg-[#000000]">
                  <img
                    src={screenshots[currentScreen].url}
                    alt={screenshots[currentScreen].label}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              {/* Indicator dots */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {screenshots.map((s, idx) => (
                  <button
                    key={s.url}
                    onClick={() => setCurrentScreen(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentScreen ? "w-6 bg-[#EDEDED]" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={s.label}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Section 03: Capabilities */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">03</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Engine &amp; capabilities
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              WallWidgy Android is engineered for privacy and endurance. All semantic search features run locally on your device without sending queries to external servers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08] space-y-1 shadow-sm">
                <h3 className="text-sm font-medium text-[#EDEDED]">Local AI Semantic Search</h3>
                <p className="text-xs text-[#8E8E8E] leading-relaxed">
                  Search wallpapers conceptually (e.g. &ldquo;moody rainy night&rdquo; or &ldquo;retro pixel art&rdquo;) using quantized on-device embeddings without internet access.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08] space-y-1 shadow-sm">
                <h3 className="text-sm font-medium text-[#EDEDED]">WorkManager Automatic Rotation</h3>
                <p className="text-xs text-[#8E8E8E] leading-relaxed">
                  Schedule background wallpaper changes at intervals of your choice. Efficient battery-conscious scheduling respects Android doze mode and Wi-Fi conditions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08] space-y-1 shadow-sm">
                <h3 className="text-sm font-medium text-[#EDEDED]">Open Source &amp; Ad-Free</h3>
                <p className="text-xs text-[#8E8E8E] leading-relaxed">
                  No tracking SDKs, telemetry, or banner advertisements. The full Kotlin codebase is published under an open source license.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://github.com/not-ayan/wallwidgy_android"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#EDEDED] underline underline-offset-4 decoration-white/25 hover:decoration-white transition-colors"
              >
                Inspect repository on GitHub &rarr;
              </a>
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