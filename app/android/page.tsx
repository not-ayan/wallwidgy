'use client'

import Link from "next/link"
import { ArrowLeft, Code, ExternalLink, Shield, Info, Github, Mail, Send, Clock, Cpu, Download, Smartphone, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
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

// Fallback release data if GitHub API fails/rate-limits
const FALLBACK_RELEASE: GithubRelease = {
  tag_name: "v1.5",
  name: "Wallwidgy v1.5 release",
  published_at: "2026-06-20T08:58:06Z",
  html_url: "https://github.com/not-ayan/wallwidgy_android/releases/tag/v1.5",
  assets: [
    {
      name: "Wallwidgy-v1.5-all-universal-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-all-universal-release.apk",
      size: 61387754,
      download_count: 84
    },
    {
      name: "Wallwidgy-v1.5-arm64-v8a-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-arm64-v8a-release.apk",
      size: 25923553,
      download_count: 52
    },
    {
      name: "Wallwidgy-v1.5-armeabi-v7a-release.apk",
      browser_download_url: "https://github.com/not-ayan/wallwidgy_android/releases/download/v1.5/Wallwidgy-v1.5-armeabi-v7a-release.apk",
      size: 22794925,
      download_count: 4
    }
  ],
  body: "## Smart Semantic Search (Offline AI)\nFinding wallpapers is now more intuitive than ever. Search using concepts instead of exact keywords.\n\n## Automated Wallpaper Rotation\nKeep your setup fresh automatically using Android WorkManager for battery-conscious background execution.\n\n## Improved Desktop & Widescreen Experience\nDesktop orientation wallpapers now use an optimized single-column layout with adaptive skeleton loaders."
};

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseApkArch(fileName: string) {
  const nameLower = fileName.toLowerCase();
  if (nameLower.includes("arm64-v8a")) {
    return {
      arch: "ARM64-v8a",
      desc: "Modern 64-bit devices",
      detailedDesc: "Compatible with most Android phones manufactured since 2016.",
      recommend: true
    };
  } else if (nameLower.includes("armeabi-v7a")) {
    return {
      arch: "ARMEABI-v7a",
      desc: "Older 32-bit devices",
      detailedDesc: "Compatible with older Android phones. Has smaller performance capabilities.",
      recommend: false
    };
  } else if (nameLower.includes("universal") || nameLower.includes("all-universal")) {
    return {
      arch: "Universal",
      desc: "All CPU Architectures",
      detailedDesc: "Includes libraries for all chipsets. Guaranteed to install on any device, but features a larger download size.",
      recommend: false
    };
  }
  return {
    arch: "Standard APK",
    desc: "Default Android Build",
    detailedDesc: "Standard package archive.",
    recommend: false
  };
}

function renderMarkdown(md: string) {
  if (!md) return null;
  const lines = md.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-2" />;

    if (trimmed.startsWith('### ')) {
      return <h5 key={index} className="text-xs font-bold text-[#F7F06D] mt-4 mb-2 uppercase font-mono">{trimmed.substring(4)}</h5>;
    }
    if (trimmed.startsWith('## ')) {
      return <h4 key={index} className="text-sm font-bold text-white mt-6 mb-3 uppercase tracking-wider font-mono border-b border-white/5 pb-1">{trimmed.substring(3)}</h4>;
    }
    if (trimmed.startsWith('# ')) {
      return <h3 key={index} className="text-base font-black text-white mt-8 mb-4 uppercase">{trimmed.substring(2)}</h3>;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2);
      return (
        <div key={index} className="flex items-start gap-2 text-xs text-white/70 font-light my-1 leading-relaxed pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] mt-1.5 flex-shrink-0" />
          <span>{parseInlineMarkdown(content)}</span>
        </div>
      );
    }

    return <p key={index} className="text-xs text-white/60 font-light leading-relaxed my-1.5">{parseInlineMarkdown(trimmed)}</p>;
  });
}

function parseInlineMarkdown(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-white">{part}</strong>;
    }
    return part;
  });
}

export default function AndroidApp() {
  const [release, setRelease] = useState<GithubRelease>(FALLBACK_RELEASE)
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(0)

  const screenshots = [
    { url: "/android/Screenshot_20260711-212432_com.notayan.wallwidgy.png", label: "Minimalist Gallery Browse" },
    { url: "/android/Screenshot_20260711-212443_com.notayan.wallwidgy.png", label: "Wallpaper Detail & Download" },
    { url: "/android/Screenshot_20260711-212451_com.notayan.wallwidgy.png", label: "Automated Rotation Controls" },
    { url: "/android/Screenshot_20260711-212454_com.notayan.wallwidgy.png", label: "On-Device AI Semantic Search" },
    { url: "/android/Screenshot_20260711-212457_com.notayan.wallwidgy.png", label: "Vibrant Color Palettes" },
    { url: "/android/Screenshot_20260711-212501_com.notayan.wallwidgy.png", label: "Saved Favorites" },
    { url: "/android/Screenshot_20260711-212505_com.notayan.wallwidgy.png", label: "Settings & Local Model State" },
    { url: "/android/Screenshot_20260711-212510_com.notayan.wallwidgy.png", label: "Landscape & Widescreen Adaptation" }
  ]

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const response = await fetch("https://api.github.com/repos/not-ayan/wallwidgy_android/releases/latest")
        if (!response.ok) {
          throw new Error("Failed to fetch from GitHub API")
        }
        const data = await response.json()

        // Filter assets to keep only APK files
        const apkAssets = data.assets.filter((asset: any) => asset.name.endsWith(".apk"))

        setRelease({
          tag_name: data.tag_name,
          name: data.name,
          published_at: data.published_at,
          html_url: data.html_url,
          assets: apkAssets.length > 0 ? apkAssets : FALLBACK_RELEASE.assets,
          body: data.body || FALLBACK_RELEASE.body
        })
      } catch (error) {
        console.error("Error fetching release:", error)
        // Keep fallback data on error
      } finally {
        setLoading(false)
      }
    }
    fetchLatestRelease()
  }, [])

  const nextScreenshot = () => {
    setCurrentScreen((prev) => (prev + 1) % screenshots.length)
  }

  const prevScreenshot = () => {
    setCurrentScreen((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  const publishDate = new Date(release.published_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="min-h-screen bg-[#060606] text-white font-aspekta relative selection:bg-[#F7F06D] selection:text-black overflow-x-hidden antialiased">
      {/* Blueprint Grid Wrapper */}
      <div className="max-w-[1440px] mx-auto border-x border-white/10 min-h-screen flex flex-col bg-[#060606]">

        {/* Technical Header */}
        <header className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10">
          <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-white/10 py-4 px-6 flex items-center justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-all duration-300 group bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded border border-white/10 text-xs tracking-wider uppercase font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Home</span>
            </Link>
          </div>

          <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center py-4 text-center">
            <Link href="/" className="font-bold text-xs tracking-widest uppercase font-mono hover:text-[#F7F06D] transition-colors">
              WALLWIDGY MOBILE CLIENT // ANDROID
            </Link>
          </div>

          <div className="md:col-span-3 py-4 px-6 flex items-center justify-end">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider uppercase">
              {loading ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-white/40" />
                  <span className="text-white/40">QUERYING GITHUB API</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-pulse" />
                  <span className="text-white/60">STABLE RELEASE ACTIVE ({release.tag_name})</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow">
          {/* Left Panel: App Specs & Download Actions (7 Columns) */}
          <section className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-12 lg:p-16 flex flex-col justify-between">
            <div className="space-y-8">
              <div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">
                  MOBILE CLIENT SPEC SHEET / SYSTEM 1.0
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white uppercase">
                  WallWidgy <span className="text-[#F7F06D] font-light italic font-serif lowercase">for</span> <br />
                  Android Device
                </h1>

                <p className="mt-6 text-white/70 font-light text-base leading-relaxed max-w-xl">
                  Take the minimal digital canvases gallery everywhere you go. WallWidgy Android client features lightning-fast performance, localized offline AI semantic search, automated wallpaper scheduling, and dynamic UI layouts that conform beautifully to your device.
                </p>
              </div>

              {/* Statistics spec table */}
              <div className="max-w-xl border border-white/10 rounded bg-white/5 overflow-hidden">
                <div className="grid grid-cols-3 text-center font-mono text-[9px] uppercase border-b border-white/10 bg-white/5 text-white/40">
                  <div className="py-2 border-r border-white/10">PLATFORM</div>
                  <div className="py-2 border-r border-white/10">COMPATIBILITY</div>
                  <div className="py-2">BUILD ENGINE</div>
                </div>
                <div className="grid grid-cols-3 text-center font-mono text-xs font-semibold py-3 text-white">
                  <div className="border-r border-white/10">ANDROID CLIENT</div>
                  <div className="border-r border-white/10">API LEVEL 26+ (8.0+)</div>
                  <div>Kotlin</div>
                </div>
              </div>

              {/* Dynamic Architecture APK Downloads */}
              <div className="space-y-4 pt-4">
                <span className="text-[10px] font-mono text-[#F7F06D] uppercase tracking-widest block border-b border-[#F7F06D]/20 pb-1 max-w-xl">
                  SELECT DEVICE CPU ARCHITECTURE BUILD
                </span>

                <div className="grid grid-cols-1 gap-3 max-w-xl">
                  {release.assets.map((asset) => {
                    const archDetails = parseApkArch(asset.name);
                    return (
                      <a
                        key={asset.name}
                        href={asset.browser_download_url}
                        className={`group p-4 rounded border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300 ${archDetails.recommend
                            ? "bg-[#F7F06D] text-black border-[#F7F06D] hover:bg-[#F7F06D]/90"
                            : "bg-white/5 text-white border-white/10 hover:border-[#F7F06D] hover:bg-white/10"
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono">
                            <Cpu className="w-4 h-4 flex-shrink-0" />
                            <span className="font-bold tracking-wider uppercase text-sm">{archDetails.arch}</span>
                            {archDetails.recommend && (
                              <span className="text-[8px] font-bold tracking-widest uppercase border border-black/30 px-1.5 py-0.5 rounded bg-black text-[#F7F06D]">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-light ${archDetails.recommend ? "text-black/80" : "text-white/60"}`}>
                            {archDetails.desc} – {archDetails.detailedDesc}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:text-right font-mono self-end sm:self-auto">
                          <div className="text-right">
                            <div className="text-xs font-bold">{formatSize(asset.size)}</div>
                            <div className={`text-[9px] ${archDetails.recommend ? "text-black/60" : "text-white/40"}`}>
                              {asset.download_count} DOWNLOADS
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:translate-y-0.5 ${archDetails.recommend ? "border-black/20 bg-black/5" : "border-white/10 bg-white/5"
                            }`}>
                            <Download className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Metadata specs */}
            <div className="flex justify-between items-end border-t border-white/5 pt-8 text-[9px] font-mono text-white/40 mt-12">
              <div>
                BUILD BRANCH / MAIN
              </div>
              <div className="text-right">
                RELEASE DATE / {publishDate}
              </div>
            </div>
          </section>

          {/* Right Panel: Smartphone Shell & Carousel (5 Columns) */}
          <section className="lg:col-span-5 p-6 sm:p-12 lg:p-16 flex flex-col justify-between bg-[#0b0b0b] relative">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-6">
              MOBILE CLIENT WIREFRAME // INTERACTIVE MOCKUP
            </div>

            {/* Custom CSS Wireframe / Phone Shell */}
            <div className="relative w-full flex flex-col items-center justify-center my-6 scale-95 sm:scale-100">

              {/* Phone Body Container (Clean Frame) */}
              <div className="w-[280px] h-[570px] border border-white/20 rounded-[38px] bg-black relative z-10 shadow-2xl p-1.5 flex flex-col justify-between hover:border-[#F7F06D]/30 transition-all duration-500">
                {/* Screen Area */}
                <div className="w-full h-full border border-white/5 rounded-[32px] bg-[#060606] relative overflow-hidden flex flex-col">
                  {/* Active Screen Slide */}
                  <div className="flex-1 w-full h-full relative overflow-hidden bg-black/90">
                    <img
                      src={screenshots[currentScreen].url}
                      alt={screenshots[currentScreen].label}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Carousel controls Overlay (placed below phone body) */}
              <div className="flex items-center gap-6 mt-4 z-20">
                <button
                  onClick={prevScreenshot}
                  className="w-8 h-8 rounded-full border border-white/20 hover:border-[#F7F06D] hover:text-[#F7F06D] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1.5">
                  {screenshots.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentScreen(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentScreen ? "bg-[#F7F06D] w-3" : "bg-white/20 hover:bg-white/40"
                        }`}
                      aria-label={`Go to screenshot ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextScreenshot}
                  className="w-8 h-8 rounded-full border border-white/20 hover:border-[#F7F06D] hover:text-[#F7F06D] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Metadata specs */}
            <div className="flex justify-between items-end border-t border-white/5 pt-8 text-[9px] font-mono text-white/40 mt-6">
              <div>
                DISPLAY PORT / AM-OLED
              </div>
              <div className="text-right">
                FRAMEWORK / NEXT-GEN
              </div>
            </div>
          </section>
        </div>

        {/* Tabbed Changelog Details Section */}
        <section className="border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left side: Version info */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-12">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-6">RELEASE JOURNAL</h3>

              <div className="p-5 rounded border border-white/20 bg-white/5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">LATEST VERSION</div>
                  <div className="text-3xl font-black text-[#F7F06D] mt-1">{release.tag_name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">PUBLISH DATE</div>
                  <div className="text-sm font-semibold text-white mt-1">{publishDate}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">REPOSITORY FEED</div>
                  <a
                    href={release.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-[#F7F06D] transition-colors mt-1 font-mono"
                  >
                    <span>GitHub Release Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right side: Dynamic Release Notes */}
            <div className="lg:col-span-8 p-6 sm:p-12 space-y-6">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">RELEASE CHANGELOG</div>

              <div>
                <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">{release.name}</h4>
                <div className="w-12 h-0.5 bg-[#F7F06D] mt-3" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded p-6 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar font-mono text-xs">
                {renderMarkdown(release.body)}
              </div>
            </div>
          </div>
        </section>

        {/* Manifesto/Privacy Details Segment */}
        <section className="border-t border-white/10 p-6 sm:p-12 lg:p-16">
          <div className="mb-10">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">DATA PRIVACY</span>
            <h2 className="text-3xl font-black tracking-tight uppercase text-white">MOBILE DATA POLICY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Zero Cloud Tracking
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                The mobile app does not include telemetry trackers, commercial ads, or tracking SDKs. Your favorite choices and settings are kept strictly localized inside the client databases.
              </p>
            </div>

            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Offline AI Sourcing
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                Search embeddings are computed on your phone processor using TensorFlow Lite. No visual text data or search queries are sent back to servers.
              </p>
            </div>

            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Open Source Audit
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                WallWidgy is built transparently. The code is completely open-source and reviewable on GitHub. You can fork it, audit the packages, or build your own custom client directly.
              </p>
            </div>
          </div>
        </section>

        {/* Creator Note & Build Status Section */}
        <section className="border-t border-white/10 p-6 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left: Designer note block */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-mono text-[#F7F06D] uppercase tracking-widest block border-b border-[#F7F06D]/10 pb-2">
                DESIGNER&apos;S NOTE
              </span>

              <blockquote className="text-xl sm:text-2xl font-light leading-relaxed text-white/80 font-sans italic border-l border-[#F7F06D]/30 pl-6 py-1">
                &ldquo;Creating a mobile app that felt just as responsive and minimal as the web version was a challenge, but building it on-device first keeps it fast and private.&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 pt-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img
                    src="/creator-ayan.png"
                    alt="Ayan"
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Ayan</div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">CREATOR / DESIGNER</div>
                </div>
              </div>
            </div>

            {/* Right: Technical status table */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-white/10 rounded bg-white/5 overflow-hidden">
                <div className="grid grid-cols-2 border-b border-white/10 p-3 text-[10px] font-mono text-white/40 tracking-wider">
                  <span>SPECIFICATION</span>
                  <span className="text-right">MOBILE APP VALUE</span>
                </div>

                <div className="divide-y divide-white/10 font-mono text-xs text-white">
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">CODE REPO</span>
                    <a
                      href="https://github.com/not-ayan/wallwidgy_android"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F7F06D] font-medium hover:underline flex items-center gap-1"
                    >
                      <span>wallwidgy_android</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">TARGET ARCHS</span>
                    <span className="text-white font-medium">arm64-v8a, armeabi-v7a, universal</span>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">CLIENT LICENSE</span>
                    <span className="text-white/60">MIT Open Source</span>
                  </div>
                </div>
              </div>

              {/* Creator details tags & Quick connect */}
              <div className="flex items-center justify-between gap-4 py-2 text-xs">
                <div className="flex items-center gap-3 font-mono text-[10px] text-white/40">
                  <span>DESIGNED BY AYAN</span>
                  <span>•</span>
                  <span>INDIA</span>
                </div>

                {/* Social badges */}
                <div className="flex items-center gap-4">
                  <a href="https://github.com/not-ayan" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#F7F06D] transition-colors" title="GitHub">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="mailto:notayan99@gmail.com" className="text-white/40 hover:text-[#F7F06D] transition-colors" title="Email">
                    <Mail className="w-4 h-4" />
                  </a>
                  <a href="https://t.me/Not_ayan99" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#F7F06D] transition-colors" title="Telegram">
                    <Send className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrated Blueprint Footer */}
        <Footer variant="blueprint" />
      </div>

      <BackToTop />
    </div>
  )
}
