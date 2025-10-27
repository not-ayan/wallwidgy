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
    <div className="relative bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-white/60 text-xs font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-white/60 hover:text-[#F7F06D] transition-colors text-xs"
        >
          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm text-white/90 font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      <main className="pt-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
        {/* Navigation */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 group bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20 w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-[#F7F06D] group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
              <Code className="w-8 h-8 text-[#F7F06D]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Wallwidgy API
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Access thousands of high-quality wallpapers programmatically with our simple REST API
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-16">
          {/* Quick Start */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Quick Start</h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <p className="text-white/80 mb-6">
                Get started with a simple GET request to retrieve random wallpapers:
              </p>
              
              <CodeBlock 
                code="curl https://wallwidgy.me/api/wallpapers"
                language="bash"
              />
              
              <div className="mt-6 p-4 bg-[#F7F06D]/10 border border-[#F7F06D]/20 rounded-lg">
                <p className="text-[#F7F06D] text-sm">
                  <strong>Live API:</strong> The API is now live and ready to use! No authentication required.
                </p>
              </div>
            </div>
          </section>

          {/* API Features */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Features</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-[#F7F06D]" />
                  <h3 className="font-semibold text-white">Random Selection</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Get randomized wallpapers on each request for variety and discovery.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-[#F7F06D]" />
                  <h3 className="font-semibold text-white">Category Filtering</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Filter by categories like nature, minimal, abstract, and more.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-[#F7F06D]" />
                  <h3 className="font-semibold text-white">Device Optimization</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Get desktop or mobile optimized wallpapers based on your needs.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-[#F7F06D]" />
                  <h3 className="font-semibold text-white">CORS Enabled</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Use from any domain - perfect for web apps and browser extensions.
                </p>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Endpoints</h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-mono">GET</span>
                  <code className="text-white font-mono">/api/wallpapers</code>
                </div>
                <p className="text-white/70 mb-6">
                  Retrieve random wallpapers with optional filtering parameters.
                </p>
                
                <h4 className="text-white font-semibold mb-4">Query Parameters</h4>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-lg border border-white/10">
                    <div>
                      <code className="text-[#F7F06D] text-sm">type</code>
                      <p className="text-white/60 text-xs mt-1">Optional</p>
                    </div>
                    <div>
                      <span className="text-white/80 text-sm">desktop | mobile</span>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Filter by device type</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-lg border border-white/10">
                    <div>
                      <code className="text-[#F7F06D] text-sm">category</code>
                      <p className="text-white/60 text-xs mt-1">Optional</p>
                    </div>
                    <div>
                      <span className="text-white/80 text-sm">string</span>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Filter by category folder</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-lg border border-white/10">
                    <div>
                      <code className="text-[#F7F06D] text-sm">count</code>
                      <p className="text-white/60 text-xs mt-1">Optional</p>
                    </div>
                    <div>
                      <span className="text-white/80 text-sm">1-10</span>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Number of wallpapers (default: 1)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Examples */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Examples</h2>
            </div>
            
            <div className="space-y-8">
              {/* Basic Example */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Get a Random Wallpaper</h3>
                <CodeBlock 
                  code="curl https://wallwidgy.me/api/wallpapers"
                />
                <div className="mt-4">
                  <h4 className="text-white/80 font-medium mb-2">Response:</h4>
                  <CodeBlock 
                    code={`{
  "wallpapers": [
    "https://wallwidgy.me/wallpapers/nature/mountain-sunset.jpg"
  ]
}`}
                    language="json"
                  />
                </div>
              </div>

              {/* Desktop Example */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Get Desktop Wallpapers</h3>
                <CodeBlock 
                  code="curl https://wallwidgy.me/api/wallpapers?type=desktop&count=3"
                />
              </div>

              {/* Category Example */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Get Wallpapers by Category</h3>
                <CodeBlock 
                  code="curl https://wallwidgy.me/api/wallpapers?category=minimal&count=2"
                />
              </div>

              {/* JavaScript Example */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">JavaScript/Fetch Example</h3>
                <CodeBlock 
                  code={`fetch('https://wallwidgy.me/api/wallpapers?type=mobile&count=5')
  .then(response => response.json())
  .then(data => {
    console.log('Wallpapers:', data.wallpapers);
    // Use the wallpaper URLs
    data.wallpapers.forEach(url => {
      console.log('Wallpaper URL:', url);
    });
  })
  .catch(error => console.error('Error:', error));`}
                  language="javascript"
                />
              </div>
            </div>
          </section>

          {/* Available Categories */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Available Categories</h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <p className="text-white/70 mb-6">
                Current categories available in our wallpaper collection:
              </p>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {['abstract', 'anime', 'architecture', 'art', 'cars', 'minimal', 'nature', 'tech'].map((category) => (
                  <div key={category} className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <code className="text-[#F7F06D] text-sm">{category}</code>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <strong>Note:</strong> Categories are based on folder structure in /public/wallpapers/
                </p>
              </div>
            </div>
          </section>

          {/* Rate Limits & Usage */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
              <h2 className="text-2xl font-bold text-white">Usage Guidelines</h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#F7F06D]" />
                    Fair Usage
                  </h3>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li>• No authentication required</li>
                    <li>• Please be respectful with request frequency</li>
                    <li>• Maximum 10 wallpapers per request</li>
                    <li>• All wallpapers are for personal use</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#F7F06D]" />
                    Attribution
                  </h3>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li>• Attribution is appreciated but not required</li>
                    <li>• Link back to wallwidgy.me</li>
                    <li>• Respect copyright of original creators</li>
                    <li>• Report any issues via GitHub</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="text-center py-16 border-t border-white/10 mt-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to integrate?
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Start using the Wallwidgy API in your projects today. No registration required.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="bg-[#F7F06D]/10 hover:bg-[#F7F06D]/20 text-[#F7F06D] font-semibold px-6 py-3 rounded-lg border border-[#F7F06D]/30 hover:border-[#F7F06D]/50 transition-all duration-300"
            >
              View Wallpapers
            </Link>
            <a
              href="https://github.com/not-ayan/wallwidgy"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}