'use client'

import Link from "next/link"
import { useState } from "react"
import { Copy, Check, Terminal } from "lucide-react"
import Header from "../components/Header"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-[#080808] border border-white/[0.08] overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-[#666666] text-xs font-mono">
          <Terminal className="w-3.5 h-3.5" />
          <span>{language}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs font-mono text-[#8E8E8E] hover:text-[#EDEDED] transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-[#E0E0E0] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface EndpointDoc {
  id: string
  method: "GET"
  path: string
  title: string
  description: string
  params?: { name: string; type: string; desc: string }[]
  exampleCurl: string
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "wallpapers",
    method: "GET",
    path: "/api/wallpapers",
    title: "Filter wallpapers",
    description: "Query wallpapers by orientation, category, color signature, or limit count.",
    params: [
      { name: "type", type: "desktop | mobile", desc: "Filter assets by device orientation." },
      { name: "category", type: "string", desc: "Filter by directory tag (e.g. minimal, anime, nature)." },
      { name: "color", type: "string", desc: "Filter by dominant color tag (e.g. blue, red, darkslategray)." },
      { name: "count", type: "integer (1..10)", desc: "Maximum count of wallpapers to return." }
    ],
    exampleCurl: `curl "https://wallwidgy.app/api/wallpapers?type=desktop&color=blue&count=5"`
  },
  {
    id: "random",
    method: "GET",
    path: "/api/random",
    title: "Random selection",
    description: "Fetch a random batch of wallpapers, ideal for daily wallpaper schedulers or widgets.",
    params: [
      { name: "count", type: "integer (1..10)", desc: "Number of random wallpapers (default: 1)." },
      { name: "type", type: "desktop | mobile", desc: "Optional orientation constraint." }
    ],
    exampleCurl: `curl "https://wallwidgy.app/api/random?count=3"`
  },
  {
    id: "colors",
    method: "GET",
    path: "/api/colors",
    title: "Color palette index",
    description: "Extract the list of unique colors derived across all indexed wallpapers with hex pairings.",
    params: [],
    exampleCurl: `curl "https://wallwidgy.app/api/colors"`
  },
  {
    id: "index",
    method: "GET",
    path: "/api/wallpapers/index",
    title: "Complete catalog index",
    description: "Direct compressed JSON payload containing metadata for all 1,770+ catalog items.",
    params: [],
    exampleCurl: `curl "https://wallwidgy.app/api/wallpapers/index"`
  }
]

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("wallpapers")
  const activeEndpoint = ENDPOINTS.find((ep) => ep.id === selectedEndpoint) || ENDPOINTS[0]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-aspekta selection:bg-white selection:text-black antialiased flex flex-col justify-between">
      {/* Universal Consistent Site Header */}
      <Header showBackButton={true} backUrl="/" />

      <main className="pt-28 sm:pt-32 pb-24 max-w-[90%] md:max-w-[88%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Editorial Headline */}
          <div className="text-left sm:text-center pb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#EDEDED] leading-[1.1] mb-6">
              Connecting to the wallpaper catalog
            </h1>

            {/* Lead Narrative */}
            <p className="text-base sm:text-lg text-[#8E8E8E] font-normal leading-relaxed mb-4 max-w-2xl mx-auto">
              WallWidgy provides open REST endpoints for developers, widgets, and automation scripts. Query wallpapers by device orientation, color palette, or random batch without API keys or authentication.
            </p>

            <p className="text-sm sm:text-base font-medium text-[#EDEDED] mb-8">
              Unauthenticated, CORS-enabled, and cached globally at edge nodes.
            </p>
          </div>

          {/* Subtle Hairline Divider */}
          <div className="border-t border-white/[0.08] my-12" />

          {/* Section 01: Quick start & Specifications */}
          <section className="space-y-6">
            <span className="text-xs font-mono text-[#555555] block">01</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Quick start &amp; specifications
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Send an unauthenticated GET request from any HTTP client or shell terminal.
            </p>

            <CodeBlock
              code="curl https://wallwidgy.app/api/wallpapers?type=desktop&count=3"
              language="bash"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Base URL</span>
                <span className="text-xs font-mono text-[#EDEDED] mt-1 block truncate">wallwidgy.app</span>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Protocol</span>
                <span className="text-xs font-mono text-[#EDEDED] mt-1 block">HTTPS / REST</span>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Auth</span>
                <span className="text-xs font-mono text-[#EDEDED] mt-1 block">None (Open)</span>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#555555] uppercase block">Rate Limit</span>
                <span className="text-xs font-mono text-[#EDEDED] mt-1 block">60 req / min</span>
              </div>
            </div>
          </section>

          {/* Section 02: Endpoint Reference */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">02</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Endpoint reference
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              Explore the primary endpoints to filter by layout, dominant palette, or download high-resolution assets.
            </p>

            {/* Endpoint selection tabs */}
            <div className="flex flex-wrap gap-2 pt-2">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    selectedEndpoint === ep.id
                      ? "bg-[#EDEDED] text-[#0A0A0A] font-semibold"
                      : "bg-white/[0.04] text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-white/[0.08] border border-white/[0.05]"
                  }`}
                >
                  {ep.path}
                </button>
              ))}
            </div>

            {/* Active Endpoint Spec Card */}
            <div className="p-6 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-[#EDEDED]">
                    {activeEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-medium text-[#EDEDED]">
                    {activeEndpoint.path}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#666666]">
                  {activeEndpoint.title}
                </span>
              </div>

              <p className="text-sm text-[#8E8E8E] leading-relaxed">
                {activeEndpoint.description}
              </p>

              {activeEndpoint.params && activeEndpoint.params.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#555555] block">
                    Query Parameters
                  </span>
                  <ul className="divide-y divide-white/[0.06] text-xs">
                    {activeEndpoint.params.map((param, i) => (
                      <li key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                        <span className="font-mono font-medium text-[#EDEDED] sm:w-28 shrink-0">
                          {param.name}
                        </span>
                        <span className="font-mono text-[#777777] sm:w-32 shrink-0 text-[11px]">
                          {param.type}
                        </span>
                        <span className="text-[#8E8E8E] leading-relaxed">
                          {param.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#555555] block mb-1">
                  Example Request
                </span>
                <CodeBlock code={activeEndpoint.exampleCurl} language="bash" />
              </div>
            </div>
          </section>

          {/* Section 03: Response Payload */}
          <section className="space-y-6 mt-16 pt-16 border-t border-white/[0.08]">
            <span className="text-xs font-mono text-[#555555] block">03</span>

            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#EDEDED]">
              Response structure
            </h2>

            <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
              All endpoints return standard JSON responses with direct CDN image URLs, dimensions, and extracted color metadata.
            </p>

            <CodeBlock
              language="json"
              code={`[
  {
    "sha": "minimalist-mountain-range",
    "name": "minimalist-mountain-range.png",
    "preview_url": "https://cdn.jsdelivr.net/gh/not-ayan/storage@main/cache/mountain.webp",
    "download_url": "https://raw.githubusercontent.com/not-ayan/storage/main/main/mountain.png",
    "resolution": "3840x2160",
    "width": 3840,
    "height": 2160,
    "orientation": "Desktop",
    "category": "minimal",
    "colors": ["darkslategray", "white", "blue"],
    "timestamp": 1720000000000
  }
]`}
            />
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