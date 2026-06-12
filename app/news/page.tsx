'use client'

import Link from "next/link"
import { ArrowLeft, Code, ExternalLink, Shield, Info, Github, Mail, Send, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

// Age Counter Component with timer
function AgeCounter({ birthDate }: { birthDate: string }) {
  const [age, setAge] = useState(0);

  useEffect(() => {
    const calculateAge = () => {
      const today = new Date();
      const birth = new Date(birthDate);
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      return calculatedAge;
    };

    setAge(calculateAge());

    const timer = setInterval(() => {
      setAge(calculateAge());
    }, 86400000);

    return () => clearInterval(timer);
  }, [birthDate]);

  return (
    <span className="font-mono text-xs text-white/70 uppercase">
      {age} YEARS OLD
    </span>
  );
}

// Birthday Indicator Component
function BirthdayIndicator({ birthDate }: { birthDate: string }) {
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const checkBirthday = () => {
      const today = new Date();
      const birth = new Date(birthDate);
      return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
    };
    setIsBirthday(checkBirthday());
  }, [birthDate]);

  if (!isBirthday) return null;

  return (
    <div className="bg-[#F7F06D]/10 border border-[#F7F06D]/30 rounded px-4 py-2.5 flex items-center gap-2 mb-8 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-ping" />
      <span className="text-xs font-mono text-[#F7F06D] uppercase tracking-wider">CREATOR BIRTHDAY EVENT ACTIVE TODAY</span>
    </div>
  );
}

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

export default function News() {
  const releases: Release[] = [
    {
      version: "v2.5",
      date: "2026.06",
      title: "Grid Redesign & Core Optimizations",
      badge: "MAJOR",
      description: "A major update featuring integrated layout filters, an overhauled search interface, client-side notifications, and significant build optimizations including purging unused codebase assets and tuning middleware matchers.",
      features: [
        { name: "REDESIGNED GRID", detail: "Integrated category filters directly into the main grid and restructured navigation headers" },
        { name: "SEARCH OVERHAUL", detail: "Completely redesigned search bar interface with improved responsive dialog animations" },
        { name: "SEO & ISR ROUTING", detail: "Integrated dynamic sitemaps and robots settings, re-routing detail pages to Incremental Static Regeneration" },
        { name: "PERFORMANCE PURGE", detail: "Purged unused Shadcn UI elements, tuned middleware matchers, and set up Cloudflare Pages migration" },
        { name: "NOTIFICATION BELL", detail: "Added client-side bell dropdowns and on-screen Toast alerts using React Portals" }
      ]
    },
    {
      version: "v2.1",
      date: "2026.02",
      title: "Cloud Sync & User Accounts",
      badge: "PRODUCTION",
      description: "We are introducing secure user accounts to enable cloud-synchronized favorites across all devices. Keep your curated list of minimal wallpapers perfectly backed up and synced.",
      features: [
        { name: "USER AUTH", detail: "Frictionless login via Clerk with email or social provider integration" },
        { name: "CLOUD FAVORITES", detail: "Sync and backup your favorite wallpapers securely to cloud database tables" }
      ]
    },
    {
      version: "v2.0",
      date: "2025.10",
      title: "AI Recommendation Engine",
      badge: "MAJOR",
      description: "A major update featuring AI-powered wallpaper suggestions based on visual style and color palettes. We have optimized search indexing for lightning-fast results.",
      features: [
        { name: "SIMILAR WALLPAPERS", detail: "Context-aware similarity algorithms running on color signatures and orientation" },
        { name: "ADVANCED SEARCH", detail: "Real-time query filtering with responsive desktop/mobile toggle triggers" },
        { name: "SPEED TUNING", detail: "Re-routed assets through CDN nodes to lower content load times" }
      ]
    }
  ];

  const [activeVersion, setActiveVersion] = useState<string>("v2.5");
  const selectedRelease = releases.find(r => r.version === activeVersion) || releases[0];

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
              WALLWIDGY MK. II
            </Link>
          </div>

          {/* Right Column: Status info */}
          <div className="md:col-span-3 py-4 px-6 flex items-center justify-end">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D] animate-pulse" />
              <span className="text-white/60">IN PRODUCTION</span>
            </div>
          </div>
        </header>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow">

          {/* Left Panel: Field Logs (7 Columns) */}
          <section className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-6">
                PERSONAL FIELD JOURNAL / 2026 / ONE UNIT
              </div>

              <BirthdayIndicator birthDate="2002-10-31" />

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
                I am building <br />
                a minimal <span className="text-[#F7F06D] font-light italic">wallpaper</span> <br />
                platform from scratch
              </h1>

              <p className="mt-8 text-white/70 font-light text-base leading-relaxed max-w-xl">
                WallWidgy is a minimal wallpaper catalog built by hand – a clean desktop and mobile gallery assembled from remote storage assets, custom API indexes, and responsive grid layouts. This site documents the timeline: what I am sourcing, what I am learning, and what it looks like when it is done.
              </p>

              {/* Statistics spec table */}
              <div className="mt-10 max-w-xl border border-white/10 rounded bg-white/5 overflow-hidden">
                <div className="grid grid-cols-3 text-center font-mono text-[9px] uppercase border-b border-white/10 bg-white/5 text-white/40">
                  <div className="py-2 border-r border-white/10">ENGINE</div>
                  <div className="py-2 border-r border-white/10">CDN</div>
                  <div className="py-2">HOSTING</div>
                </div>
                <div className="grid grid-cols-3 text-center font-mono text-xs font-semibold py-3 text-white">
                  <div className="border-r border-white/10">NEXT.JS 16</div>
                  <div className="border-r border-white/10">GITHUB CDN</div>
                  <div>VERCEL</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="bg-[#F7F06D] text-black hover:bg-[#F7F06D]/95 px-6 py-3 rounded text-xs font-mono tracking-wider uppercase font-semibold transition-colors"
                >
                  EXPLORE THE SITE
                </Link>
                <Link
                  href="/api"
                  className="border border-white/20 hover:bg-white/5 text-white px-6 py-3 rounded text-xs font-mono tracking-wider uppercase font-semibold transition-colors"
                >
                  WHAT IS THE API SCHEMA?
                </Link>
              </div>
            </div>

            {/* Bottom Divider / Gap filler */}
            <div className="mt-12 lg:mt-24 border-t border-white/5 pt-8" />
          </section>

          {/* Right Panel: Isometric Schematic Drawing (5 Columns) */}
          <section className="lg:col-span-5 p-6 sm:p-12 lg:p-16 flex flex-col justify-between bg-[#0b0b0b] relative">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-10">
              MK. IV – ISOMETRIC VIEW
            </div>

            {/* Custom CSS Wireframe / Device Schematic */}
            <div className="relative w-full aspect-[4/3] flex items-center justify-center my-12 py-10 scale-90 sm:scale-100">

              {/* Desktop Monitor Shell */}
              <div className="w-64 h-40 border border-white/30 rounded-lg bg-[#0e0e0e] relative z-10 shadow-lg p-1.5 flex flex-col justify-between">
                <div className="w-full h-32 border border-white/10 rounded bg-[#121212] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#060606]/40 backdrop-blur-[1px]" />
                  {/* Grid lines inside mockup screen */}
                  <div className="w-full h-full border border-dashed border-white/5 relative flex items-center justify-center">
                    <span className="font-mono text-[9px] text-white/20">WALLWIDGY DISPLAY</span>
                    <div className="w-16 h-10 border border-[#F7F06D]/20 rounded absolute bottom-2 right-2 flex items-center justify-center bg-[#F7F06D]/5">
                      <span className="text-[7px] text-[#F7F06D] font-mono">Mobile view</span>
                    </div>
                  </div>
                </div>
                {/* Desktop bezel control light */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] font-mono text-white/40">MK. II</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F7F06D]" />
                </div>
              </div>

              {/* Monitor Stand Base */}
              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-16 h-12 border-x border-white/25 pointer-events-none" />
              <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-28 h-2.5 border border-white/25 rounded bg-[#0e0e0e] pointer-events-none" />

              {/* Labeled Lines Overlay */}

              {/* Antenna line */}
              <div className="absolute top-2 right-1/4 w-0.5 h-12 bg-white/20" />
              <div className="absolute top-1.5 right-[24.5%] w-1.5 h-1.5 rounded-full bg-[#F7F06D]" />
              <div className="absolute -top-3 right-1/4 translate-x-1/2 text-[8px] font-mono text-white/40">Antenna</div>

              {/* Screen Label Pointer */}
              <div className="absolute left-[8%] top-[38%] w-16 h-[1px] bg-white/20 border-dashed" />
              <div className="absolute left-[8%] top-[38%] w-1.5 h-1.5 rounded-full bg-white/60 -translate-y-1/2" />
              <div className="absolute left-[-2%] top-[30%] text-[8px] font-mono text-white/40 bg-[#0b0b0b] px-1">OLED Screen</div>

              {/* Bezel Label Pointer */}
              <div className="absolute right-[8%] bottom-[38%] w-16 h-[1px] bg-white/20 border-dashed" />
              <div className="absolute right-[24%] bottom-[38%] w-1.5 h-1.5 rounded-full bg-white/60 -translate-y-1/2" />
              <div className="absolute right-[2%] bottom-[30%] text-[8px] font-mono text-white/40 bg-[#0b0b0b] px-1">Control Panel</div>

              {/* Base Label Pointer */}
              <div className="absolute right-[15%] bottom-[18%] w-16 h-[1px] bg-white/20 border-dashed" />
              <div className="absolute right-[31%] bottom-[18%] w-1.5 h-1.5 rounded-full bg-white/60 -translate-y-1/2" />
              <div className="absolute right-[10%] bottom-[10%] text-[8px] font-mono text-white/40 bg-[#0b0b0b] px-1">Keyboard / Base</div>

            </div>

            {/* Bottom Metadata specs */}
            <div className="flex justify-between items-end border-t border-white/5 pt-8 text-[9px] font-mono text-white/40">
              <div>
                REV D / 2047.03
              </div>
              <div className="text-right">
                6061-T6 / SALVAGED ABS
              </div>
            </div>
          </section>

        </div>

        {/* Tabbed Changelog Details Section */}
        <section className="border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* Left side: Version list */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-12">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-6">JOURNAL TIMELINE</h3>

              <div className="space-y-3">
                {releases.map((release) => (
                  <button
                    key={release.version}
                    onClick={() => setActiveVersion(release.version)}
                    className={`w-full text-left p-4 rounded border transition-all duration-300 flex items-center justify-between ${activeVersion === release.version
                      ? "bg-[#F7F06D] text-black border-[#F7F06D]"
                      : "bg-transparent text-white/80 border-white/20 hover:border-[#F7F06D] hover:text-[#F7F06D]"
                      }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wide opacity-75">{release.date}</div>
                      <div className="text-xl font-bold mt-1">{release.version}</div>
                    </div>
                    <span className="text-[9px] font-mono uppercase border px-2 py-0.5 rounded opacity-90">
                      {release.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Selected Version Spec sheet */}
            <div className="lg:col-span-8 p-6 sm:p-12">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">VERSION METADATA SHEET</div>

              <div key={activeVersion} className="animate-slideIn space-y-6">
                <div>
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{selectedRelease.title}</h4>
                  <div className="w-12 h-0.5 bg-[#F7F06D] mt-3" />
                </div>

                <p className="text-white/70 font-light text-base leading-relaxed">
                  {selectedRelease.description}
                </p>

                <div className="pt-4 space-y-3">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">DELIVERABLES LIST</span>

                  <div className="border border-white/10 rounded overflow-hidden divide-y divide-white/10">
                    {selectedRelease.features.map((feat, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-12 p-3 bg-white/5">
                        <div className="sm:col-span-4 font-mono text-xs font-semibold text-[#F7F06D] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F7F06D]" />
                          {feat.name}
                        </div>
                        <div className="sm:col-span-8 text-xs text-white/70 font-light pt-1 sm:pt-0">
                          {feat.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* API Integration Segment (Blueprint Grid) */}
        <section className="border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* API text details */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-12 lg:p-16 space-y-6">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">API MODULE</span>
              <div className="w-10 h-10 bg-[#F7F06D]/10 border border-[#F7F06D]/20 rounded flex items-center justify-center">
                <Code className="w-5 h-5 text-[#F7F06D]" />
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-none uppercase text-white">STATION API FEED</h2>
              <p className="text-white/70 font-light text-sm leading-relaxed">
                Connect external terminals to the WallWidgy database. Access random batches, fetch Hex colors indexes, and query categories via clean, unauthenticated REST requests.
              </p>
              <div>
                <Link
                  href="/api"
                  className="inline-flex items-center gap-2 bg-[#F7F06D] text-black hover:bg-[#F7F06D]/95 px-6 py-3 rounded text-xs font-mono tracking-wider uppercase font-semibold transition-colors"
                >
                  <Code className="w-4 h-4" />
                  READ API DOCS
                </Link>
              </div>
            </div>

            {/* API parameters tables */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2">

              <div className="border-b sm:border-b-0 sm:border-r border-white/10 p-6 sm:p-12 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
                  <span className="text-[9px] font-mono uppercase text-white/40">REST ENDPOINTS</span>
                  <span className="text-[8px] font-mono bg-[#F7F06D]/10 text-[#F7F06D] border border-[#F7F06D]/25 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-2.5 font-mono text-xs text-white/80">
                  <div className="p-3 border border-white/10 bg-white/5 rounded flex justify-between items-center">
                    <span>GET /api/wallpapers</span>
                    <span className="text-[9px] text-[#F7F06D] uppercase">RANDOM BATCH</span>
                  </div>
                  <div className="p-3 border border-white/10 bg-white/5 rounded flex justify-between items-center">
                    <span>GET /api/colors</span>
                    <span className="text-[9px] text-white/40 uppercase">COLOR INDEX</span>
                  </div>
                  <div className="p-3 border border-white/10 bg-white/5 rounded flex justify-between items-center">
                    <span>GET /api/favorites</span>
                    <span className="text-[9px] text-white/40 uppercase">USER SYNC</span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-12 space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
                  <span className="text-[9px] font-mono uppercase text-white/40">USAGE GUIDELINES</span>
                  <span className="text-[8px] font-mono text-white/30">CORS OK</span>
                </div>
                <ul className="space-y-4 text-xs text-white/60 font-light">
                  <li className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#F7F06D] flex-shrink-0" />
                    <span>No authorization headers needed for query feeds</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-[#F7F06D] flex-shrink-0" />
                    <span>CORS headers enabled for cross-origin fetches</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#F7F06D] flex-shrink-0" />
                    <span>Fair-use throttling limited to 60 calls / min</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Legal Grid Section */}
        <section className="border-t border-white/10 p-6 sm:p-12 lg:p-16">
          <div className="mb-10">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">MANIFESTO</span>
            <h2 className="text-3xl font-black tracking-tight uppercase text-white">TERMS &amp; DATA PRIVACY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Copyright &amp; Sourcing
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                Wallpapers listed are curated for personal usage. Files are sourced from public forums. If you own the copyright to any image and request removal, please contact the email portal.
              </p>
            </div>

            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Telemetry Policies
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                We capture anonymous load metrics to measure image asset transfer speed performance. No personal tracking data is stored, and your favorites remain private until you export.
              </p>
            </div>

            <div className="border-l border-white/10 pl-6 py-2 hover:border-[#F7F06D] transition-all duration-300">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#F7F06D] mb-3 flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Disclaimer of uptime
              </h4>
              <p className="text-white/60 text-xs leading-relaxed font-light">
                The service is delivered on an as-is basis. We make no guarantees of continuous server uptime or image resolution availability. All downloads are managed at the user&apos;s risk.
              </p>
            </div>
          </div>
        </section>

        {/* Creator Note & Build Status Section (Simplified Blueprint styling) */}
        <section className="border-t border-white/10 p-6 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left: Designer note block */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-mono text-[#F7F06D] uppercase tracking-widest block border-b border-[#F7F06D]/10 pb-2">
                DESIGNER&apos;S NOTE
              </span>

              <blockquote className="text-xl sm:text-2xl font-light leading-relaxed text-white/80 font-sans italic border-l border-[#F7F06D]/30 pl-6 py-1">
                &ldquo;I just started this platform as a fun little project but the love you guys have shown makes me want to make it even better.&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 pt-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group">
                  <img
                    src="/creator-ayan.png"
                    alt="Ayan"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
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
                  <span className="text-right">CURRENT STATUS</span>
                </div>

                <div className="divide-y divide-white/10 font-mono text-xs text-white">
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">STAGE</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[#F7F06D] font-medium">Production / Stable</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">BUILDS COMPILED</span>
                    <span className="text-white font-medium">108 / 108</span>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">DEVELOPMENT STATE</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-white font-medium">Active Maintenance</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-white/40">EST. COMPLETION</span>
                    <span className="text-white/40 italic">Ongoing</span>
                  </div>
                </div>
              </div>

              {/* Creator details tags & Quick connect */}
              <div className="flex items-center justify-between gap-4 py-2 text-xs">
                <div className="flex items-center gap-3 font-mono text-[10px] text-white/40">
                  <AgeCounter birthDate="2002-10-31" />
                  <span>•</span>
                  <span>MALE</span>
                </div>

                {/* Micro social badges */}
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

      {/* Slide-in Animations */}
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}