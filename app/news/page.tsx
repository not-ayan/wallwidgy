'use client'

import Link from "next/link"
import { Shield, Info, FileText, Code, ExternalLink, ArrowLeft, Star, Users, Zap, Globe, Sparkles, CheckCircle, Clock, TrendingUp, Github, Mail, AtSign, UserRound, CalendarDays, MessageCircle, Send } from "lucide-react"
import { useEffect, useState } from "react"
import Footer from "../components/Footer"
import BackToTop from "../components/BackToTop"

// Age Counter Component with timer
function AgeCounter({ birthDate }: { birthDate: string }) {
  const [age, setAge] = useState(0);
  
  useEffect(() => {
    // Calculate exact age based on birth date
    const calculateAge = () => {
      const today = new Date();
      const birth = new Date(birthDate);
      
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      
      // Adjust age if birthday hasn't occurred yet this year
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      
      return calculatedAge;
    };
    
    // Set initial age
    setAge(calculateAge());
    
    // Update age every day (24 hours)
    const timer = setInterval(() => {
      setAge(calculateAge());
    }, 86400000);
    
    return () => clearInterval(timer);
  }, [birthDate]);
  
  return (
    <span className="bg-white/5 text-white/80 text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/10 flex items-center gap-1.5">
      <CalendarDays className="w-3 h-3 text-[#F7F06D]" />
      <span>{age} years</span>
    </span>
  );
}

// Birthday Indicator Component
function BirthdayIndicator({ birthDate }: { birthDate: string }) {
  const [isBirthday, setIsBirthday] = useState(false);
  
  useEffect(() => {
    // Check if today is the birthday
    const checkBirthday = () => {
      const today = new Date();
      const birth = new Date(birthDate);
      
      // Compare month and day only
      return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
    };
    
    setIsBirthday(checkBirthday());
  }, [birthDate]);
  
  if (!isBirthday) return null;
  
  return (
    <div className="bg-gradient-to-r from-[#F7F06D]/20 to-pink-500/20 border border-[#F7F06D]/50 rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
      <span className="text-2xl">🎉</span>
      <span className="text-[#F7F06D] font-semibold text-sm">It&apos;s my birthday today!</span>
    </div>
  );
}

export default function News() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      <main className="pt-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative">
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

        {/* Birthday Indicator */}
        <div className="mb-12">
          <BirthdayIndicator birthDate="2002-10-31" />
        </div>

        {/* Main Content Sections */}
  <div className="space-y-20 md:space-y-24">
          {/* Latest Updates Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <FileText className="w-6 h-6 text-[#F7F06D]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">Latest Updates</h2>
                <p className="text-white/70 text-sm md:text-base">Recent improvements and new features</p>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-6 right-6">
                <span className="bg-[#F7F06D]/20 text-[#F7F06D] text-xs font-medium px-3 py-1 rounded-full border border-[#F7F06D]/30">
                  ✨ New
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  <span className="text-[#F7F06D] font-mono font-semibold">v2.0</span>
                </div>
                <span className="text-white/60">October 31, 2025</span>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 leading-snug">Enhanced Search & Performance</h3>
              <p className="text-white/80 mb-5 md:mb-6 leading-relaxed max-w-3xl">
                We've significantly improved our search capabilities and overall platform performance. 
                Enjoy faster loading times, more accurate results, and a smoother browsing experience.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#F7F06D]"></div>
                    <span className="text-white font-medium">Improved Search</span>
                  </div>
                  <p className="text-white/70 text-sm">Better filtering and more accurate results</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <span className="text-white font-medium">Ai based recommendations</span>
                  </div>
                  <p className="text-white/70 text-sm">Ai based wallpaper suggestions based on wallpaper style</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <span className="text-white font-medium">Api Improvements</span>
                  </div>
                  <p className="text-white/70 text-sm">Added api for idk something</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <span className="text-white font-medium">Bug Fixes</span>
                  </div>
                  <p className="text-white/70 text-sm">Resolved critical issues and improved stability</p>
                </div>
              </div>
            </div>
          </section>

          {/* About Platform Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Info className="w-6 h-6 text-[#F7F06D]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">About Wallwidgy</h2>
                <p className="text-white/70 text-sm md:text-base">Learn more about our platform and mission</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">The Platform</h3>
                </div>
                <p className="text-white/80 leading-relaxed mb-5 sm:mb-6 max-w-prose text-sm sm:text-base">
                  Wallwidgy is a curated collection of high-quality wallpapers designed for enthusiasts 
                  who appreciate clean, minimalist, and artistic designs. Our platform focuses on providing 
                  a seamless experience for discovering and downloading beautiful wallpapers.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-medium text-white/80">Minimalist Design</span>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-medium text-white/80">High Quality</span>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-medium text-white/80">Free to Use</span>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-3 h-3 rounded-full bg-[#F7F06D]"></div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">About the Creator</h3>
                </div>
                
                <div className="space-y-4 sm:space-y-5">
                  {/* Name only */}
                  <div>
                    <h4 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      Ayan
                      <div className="w-2 h-2 rounded-full bg-[#F7F06D] animate-pulse"></div>
                    </h4>
                  </div>
                  
                  {/* Bio */}
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                    A designer from Assam, India trying to make cool stuff that works well.
                  </p>
                  
                  {/* Social Links with badges */}
                  <div className="space-y-3">
                    <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Connect</p>
                    
                    {/* Social Links - Mobile responsive */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Link 
                        href="https://github.com/not-ayan" 
                        target="_blank" 
                        aria-label="GitHub" 
                        className="group/link relative h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/10 hover:border-[#F7F06D]/30 bg-white/5 hover:bg-[#F7F06D]/10 flex items-center justify-center transition-all duration-300"
                      >
                        <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover/link:text-[#F7F06D] transition-colors duration-300" />
                      </Link>
                      <Link 
                        href="mailto:notayan99@gmail.com" 
                        aria-label="Email" 
                        className="group/link relative h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/10 hover:border-[#F7F06D]/30 bg-white/5 hover:bg-[#F7F06D]/10 flex items-center justify-center transition-all duration-300"
                      >
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover/link:text-[#F7F06D] transition-colors duration-300" />
                      </Link>
                      <Link 
                        href="https://t.me/Not_ayan99" 
                        target="_blank" 
                        aria-label="Telegram" 
                        className="group/link relative h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/10 hover:border-[#F7F06D]/30 bg-white/5 hover:bg-[#F7F06D]/10 flex items-center justify-center transition-all duration-300"
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover/link:text-[#F7F06D] transition-colors duration-300" />
                      </Link>
                    </div>
                    
                    {/* Info badges - Separate row on mobile */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="bg-white/5 text-white/80 text-xs uppercase font-medium tracking-wider h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border border-white/10 flex items-center gap-1.5">
                        <UserRound className="w-3 h-3 text-[#F7F06D]" />
                        <span>Male</span>
                      </span>
                      <AgeCounter birthDate="2002-01-15" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* API Development Section */}
          <section>
      <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Code className="w-6 h-6 text-[#F7F06D]" />
              </div>
              <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">API Development</h2>
        <p className="text-white/70 text-sm md:text-base">Developer tools and integration coming soon</p>
              </div>
            </div>
            
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 relative">
              <div className="absolute top-6 right-6">
                <span className="bg-[#F7F06D]/20 text-[#F7F06D] text-xs font-medium px-3 py-1 rounded-full border border-[#F7F06D]/30">
                  ✨ Live
                </span>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-snug">Developer API</h3>
              <p className="text-white/80 mb-6 md:mb-8 leading-relaxed max-w-3xl">
                Our comprehensive API is now live! Developers can integrate Wallwidgy's collection 
                into their applications with simple REST endpoints. Get random wallpapers, filter by 
                category or device type - no authentication required.
              </p>
              
              <div className="mb-6">
                <Link 
                  href="/api"
                  className="inline-flex items-center gap-2 bg-[#F7F06D]/10 hover:bg-[#F7F06D]/20 text-[#F7F06D] font-semibold px-6 py-3 rounded-lg border border-[#F7F06D]/30 hover:border-[#F7F06D]/50 transition-all duration-300"
                >
                  <Code className="w-4 h-4" />
                  View API Documentation
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 md:p-6 border border-white/10">
                  <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F7F06D]"></div>
                    Planned Features
                  </h4>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>RESTful API endpoints</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>Random wallpaper selection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>Category & device filtering</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>CORS enabled & documentation</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 md:p-6 border border-white/10">
                  <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F7F06D]"></div>
                    Status
                  </h4>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>API live: October 2025</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#F7F06D]" />
                      <span>Documentation: Complete</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-white/80" />
                      <span>Rate limiting: Planned</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-white/80" />
                      <span>Authentication: Future</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Information Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Shield className="w-6 h-6 text-[#F7F06D]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">Legal & Privacy</h2>
                <p className="text-white/70 text-sm md:text-base">Important information about our terms and policies</p>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="grid gap-5 md:gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 md:p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-[#F7F06D]" />
                    <h3 className="text-lg font-semibold text-white">Copyright & Usage</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    We respect intellectual property rights. All wallpapers are provided for personal use and are taken from Pinterest or similar sources. 
                    If you believe any content infringes on your copyright, please contact us for prompt removal.
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 md:p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-[#F7F06D]" />
                    <h3 className="text-lg font-semibold text-white">Privacy Policy</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    We dont collect any data other than user analytics.
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 md:p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <ExternalLink className="w-5 h-5 text-[#F7F06D]" />
                    <h3 className="text-lg font-semibold text-white">Service Terms</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    This service is provided "as is" without warranties. We strive for reliability but are not 
                    responsible for any damages arising from platform use.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Call to Action Section */}
        <div className="text-center py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to explore our collection?
          </h2>
          <p className="text-white/70 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover thousands of high-quality wallpapers carefully curated for every taste and style.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <Link 
              href="/"
              className="bg-white/5 hover:bg-white/10 text-[#F7F06D] font-semibold px-8 py-4 rounded-lg border border-[#F7F06D]/30 hover:border-[#F7F06D]/50 transition-all duration-300"
            >
              Browse Wallpapers
            </Link>
            <Link 
              href="/categories"
              className="bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              View Categories
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  )
}