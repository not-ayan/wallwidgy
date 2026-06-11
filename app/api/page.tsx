'use client'

import Link from "next/link"
import { Code, ArrowLeft, ExternalLink, Copy, CheckCircle, Globe, Zap, Shield, Database } from "lucide-react"
import { useState } from "react"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

// Code block component with copy functionality
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-black/40 backdrop-blur-sm rounded border border-white/10 overflow-hidden w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-white/60 hover:text-[#F7F06D] transition-colors text-xs font-mono"
        >
          {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs sm:text-sm text-white/90 font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const getColorBgClass = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-500'
    case 'red': return 'bg-red-500'
    case 'green': return 'bg-green-500'
    case 'purple': return 'bg-purple-500'
    case 'pink': return 'bg-pink-500'
    case 'orange': return 'bg-orange-500'
    case 'yellow': return 'bg-yellow-400'
    case 'black': return 'bg-gray-950 border border-white/20'
    case 'white': return 'bg-white border border-gray-400'
    default: return 'bg-gray-500'
  }
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#060606] text-white font-aspekta relative selection:bg-[#F7F06D] selection:text-black overflow-x-hidden antialiased">
      
      {/* Blueprint Grid Wrapper */}
      <div className="max-w-[1440px] mx-auto border-x border-white/10 min-h-screen flex flex-col bg-[#060606]">
        
        {/* Technical Header */}
        <header className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10">
          {/* Back Button Column */}
          <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-white/10 py-4 px-6 flex items-center justify-start">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white/60 hover:text-white transition-all duration-300 group bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded border border-white/10 text-xs tracking-wider uppercase font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </Link>
          </div>
          
          {/* Center Column: Title */}
          <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-white/10 flex items-center justify-center py-4 text-center">
            <Link href="/" className="font-bold text-xs tracking-widest uppercase font-mono hover:text-[#F7F06D] transition-colors">
              WALLWIDGY API // CORE REFERENCE
            </Link>
          </div>

          {/* Right Column: Status info */}
          <div className="md:col-span-3 py-4 px-6 flex items-center justify-end">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-pulse" />
              <span className="text-white/60">● API ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Section 1: Overview & Quick Start (Split 7/5 grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/10">
          {/* Left Panel: Introduction */}
          <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                API GATEWAY DOCUMENTATION
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
                Wallwidgy REST API
              </h1>
              
              <p className="text-white/70 font-light text-base leading-relaxed max-w-2xl">
                Welcome to the Wallwidgy developer reference. Use our simple public endpoint queries to fetch wallpapers, filter by categories and primary colors, and retrieve random visual assets directly for your client applications or browser extensions.
              </p>

              {/* Quick Start Request */}
              <div className="space-y-3 pt-6">
                <span className="text-[10px] font-mono text-[#F7F06D] uppercase tracking-widest block">
                  QUICK START REQUEST
                </span>
                <CodeBlock 
                  code="curl https://wallwidgy.vercel.app/api/wallpapers"
                  language="bash"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Specifications */}
          <div className="lg:col-span-5 p-6 sm:p-12 lg:p-16 bg-[#0b0b0b] flex flex-col justify-center">
            <div className="space-y-6">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                CORE SPECS // API_GATEWAY_V1
              </div>

              <div className="border border-white/10 rounded bg-[#060606] overflow-hidden">
                <div className="grid grid-cols-2 border-b border-white/10 p-3.5 text-[9px] font-mono text-white/40 tracking-wider">
                  <span>SPECIFICATION</span>
                  <span className="text-right">PARAMETER</span>
                </div>
                
                <div className="divide-y divide-white/10 font-mono text-xs text-white">
                  <div className="flex justify-between p-3.5">
                    <span className="text-white/40">BASE ENDPOINT</span>
                    <span className="text-[#F7F06D] font-medium select-all">https://wallwidgy.vercel.app</span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-white/40">PROTOCOL &amp; AUTH</span>
                    <span className="text-white font-medium">HTTPS / REST (No API Key Required)</span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-white/40">CORS STATE</span>
                    <span className="text-[#F7F06D] font-medium">Headers Enabled (*)</span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-white/40">IP THROTTLING</span>
                    <span className="text-white font-medium">60 requests / minute per IP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Endpoint Schema (Split 7/5 grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/10">
          {/* Left Panel: Parameters */}
          <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/20 text-[#F7F06D] px-2.5 py-0.5 rounded text-xs font-mono border border-[#F7F06D]/20">GET</span>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase">/api/wallpapers</h2>
            </div>
            
            <p className="text-white/70 text-sm font-light leading-relaxed">
              Retrieve a list of wallpaper assets. Supported query parameters allow filtering by category, device layout, and color signature.
            </p>

            <div className="space-y-4">
              <span className="text-[10px] font-mono text-[#F7F06D] uppercase tracking-widest block border-b border-[#F7F06D]/15 pb-1">
                Query Parameters
              </span>
              
              <div className="border border-white/10 rounded bg-[#0b0b0b] overflow-hidden divide-y divide-white/10 font-mono text-xs">
                <div className="grid grid-cols-12 p-3 text-[9px] text-white/40 tracking-wider">
                  <div className="col-span-3">PARAMETER</div>
                  <div className="col-span-3">TYPE</div>
                  <div className="col-span-6">DESCRIPTION</div>
                </div>
                
                <div className="grid grid-cols-12 p-4 items-center gap-2 lg:gap-0">
                  <div className="col-span-3 text-[#F7F06D] font-bold">type</div>
                  <div className="col-span-3 text-white/60">desktop | mobile</div>
                  <div className="col-span-6 text-white/80 font-light">Filter papers by target layout resolution</div>
                </div>

                <div className="grid grid-cols-12 p-4 items-center gap-2 lg:gap-0">
                  <div className="col-span-3 text-[#F7F06D] font-bold">category</div>
                  <div className="col-span-3 text-white/60">string</div>
                  <div className="col-span-6 text-white/80 font-light">Filter by folder (e.g., &quot;minimal&quot;)</div>
                </div>

                <div className="grid grid-cols-12 p-4 items-center gap-2 lg:gap-0">
                  <div className="col-span-3 text-[#F7F06D] font-bold">color</div>
                  <div className="col-span-3 text-white/60">string</div>
                  <div className="col-span-6 text-white/80 font-light">Filter by primary color tag (e.g., &quot;blue&quot;)</div>
                </div>

                <div className="grid grid-cols-12 p-4 items-center gap-2 lg:gap-0">
                  <div className="col-span-3 text-[#F7F06D] font-bold">count</div>
                  <div className="col-span-3 text-white/60">integer [1..10]</div>
                  <div className="col-span-6 text-white/80 font-light">Number of wallpaper assets to return (default: 1)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Specifications Note */}
          <div className="lg:col-span-5 p-6 sm:p-12 lg:p-16 bg-[#0b0b0b] flex flex-col justify-center space-y-6">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/10 pb-2">
              QUERY SPECIFICATIONS
            </span>
            <p className="text-white/60 text-xs leading-relaxed font-light">
              Filters are optional and can be combined together. If multiple filters are applied, the query executes as a logical AND operation. If no matching assets exist for a filter combination, an empty query payload is returned.
            </p>
            <div className="space-y-3">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
                Parameters Combined Query Example
              </span>
              <CodeBlock 
                code={`curl "https://wallwidgy.vercel.app/api/wallpapers?type=desktop&category=minimal&count=2"`}
                language="bash"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Signatures (Split 6/6 grid) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/10">
          {/* Left Panel: Client Fetch Script */}
          <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 space-y-4">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
              Client Fetch Script
            </span>
            <CodeBlock 
              code={`fetch('https://wallwidgy.vercel.app/api/wallpapers?type=mobile&count=2')\n  .then(res => res.json())\n  .then(data => {\n    console.log(data.wallpapers);\n  });`}
              language="javascript"
            />
          </div>

          {/* Right Panel: JSON Response Payload */}
          <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 space-y-4">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
              JSON Response Payload
            </span>
            <CodeBlock 
              code={`{\n  "wallpapers": [\n    "https://wallwidgy.vercel.app/wallpapers/minimal/desert-dune.jpg",\n    "https://wallwidgy.vercel.app/wallpapers/minimal/foggy-forest.jpg"\n  ],\n  "count": 2,\n  "category": "minimal",\n  "type": "mobile",\n  "color": "all"\n}`}
              language="json"
            />
          </div>
        </section>

        {/* Section 4: Valid Values Directory (3-Column split) */}
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10 bg-[#0b0b0b]">
          {/* Categories Column */}
          <div className="p-6 sm:p-12 lg:p-16 space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] flex items-center gap-2 font-mono">
                <Database className="w-3.5 h-3.5" />
                AVAILABLE CATEGORIES
              </h4>
              <div className="flex flex-wrap gap-2 font-mono text-[9px]">
                {['abstract', 'anime', 'architecture', 'art', 'cars', 'minimal', 'nature', 'tech'].map((category) => (
                  <span key={category} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white/80">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Category Query Example</span>
              <CodeBlock 
                code={`curl "https://wallwidgy.vercel.app/api/wallpapers?category=minimal"`}
                language="bash"
              />
            </div>
          </div>

          {/* Colors Column */}
          <div className="p-6 sm:p-12 lg:p-16 space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] flex items-center gap-2 font-mono">
                <Globe className="w-3.5 h-3.5" />
                PRIMARY COLORS
              </h4>
              <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                {['blue', 'red', 'green', 'purple', 'pink', 'orange', 'yellow', 'black', 'white'].map((color) => (
                  <div key={color} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    <span className={`w-1.5 h-1.5 rounded-full ${getColorBgClass(color)}`} />
                    <span className="text-white/70 uppercase">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Color Query Example</span>
              <CodeBlock 
                code={`curl "https://wallwidgy.vercel.app/api/wallpapers?color=blue"`}
                language="bash"
              />
            </div>
          </div>

          {/* Guidelines Column */}
          <div className="p-6 sm:p-12 lg:p-16 space-y-6 bg-[#0a0a0a] flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] flex items-center gap-2 font-mono">
                <Shield className="w-3.5 h-3.5" />
                USAGE POLICIES
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light font-mono">
                No developer key required. Fair-use throttle limits prevent request flooding at 60 requests/minute. Content files are delivered strictly for personal layout usage.
              </p>
            </div>
            
            <div className="pt-4 border-t border-white/5 mt-4 opacity-50 font-mono text-[9px] text-white/30 tracking-widest">
              STATUS // FULL_ACCESS
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