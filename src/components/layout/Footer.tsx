import React from 'react';
import { Mail, Shield, CheckCircle, Instagram, Twitter, Facebook, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="bg-[#1A1A1A] text-[#FAFAFA] border-t border-neutral-800 pt-16 pb-28 md:pb-16 px-4 md:px-8 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Mission (About) */}
          <div className="space-y-4">
            <div onClick={handleScrollToTop} className="flex items-center space-x-3 cursor-pointer">
              <div className="w-6.5 h-6.5 bg-[#6C4CF1] rounded-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#F4B400] rounded-full"></div>
              </div>
              <h2 className="font-display font-bold text-lg tracking-tight">
                My<span className="text-[#6C4CF1]">Day</span>
              </h2>
            </div>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed max-w-sm">
              MyDay is a luxury, AI-assisted birthday planning platform delivering bespoke milestone experiences. We partner with vetted, top-tier vendor collectives to create stress-free, memories.
            </p>
            <div className="flex items-center space-x-2 text-[9px] font-mono text-neutral-500 tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#F4B400]" />
              <span>AI PLATFORM SECURED</span>
            </div>
          </div>

          {/* Features Column */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#F4B400]">
              Features
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-neutral-400">
              <li><a href="#features" className="hover:text-white hover:underline transition-all cursor-pointer">🤖 AI Birthday Planner</a></li>
              <li><a href="#features" className="hover:text-white hover:underline transition-all cursor-pointer">🎂 Cake Recommendations</a></li>
              <li><a href="#features" className="hover:text-white hover:underline transition-all cursor-pointer">🎁 Personalized Gift Ideas</a></li>
              <li><a href="#features" className="hover:text-white hover:underline transition-all cursor-pointer">💰 Smart Budget Planning</a></li>
            </ul>
          </div>

          {/* Privacy & Terms */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#F4B400]">
              Legal & Policy
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-neutral-400">
              <li><span className="hover:text-white hover:underline transition-all cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white hover:underline transition-all cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white hover:underline transition-all cursor-pointer">Cookie Settings</span></li>
              <li><span className="hover:text-white hover:underline transition-all cursor-pointer">Cancellation Policy</span></li>
            </ul>
          </div>

          {/* Contact & Social media */}
          <div className="space-y-5">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#F4B400]">
              Contact & Socials
            </h4>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed">
              Have questions? Connect with our dedicated concierge desk.
            </p>
            <div className="flex space-x-3.5 pt-1">
              <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#6C4CF1] transition-all duration-300 text-neutral-400 hover:text-white cursor-pointer">
                <Instagram className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#6C4CF1] transition-all duration-300 text-neutral-400 hover:text-white cursor-pointer">
                <Twitter className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-[#6C4CF1] transition-all duration-300 text-neutral-400 hover:text-white cursor-pointer">
                <Facebook className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <Mail className="w-4 h-4 text-[#F4B400]" />
              <span className="font-sans">concierge@myday.ai</span>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-sans text-neutral-500">
          <p>© {new Date().getFullYear()} MyDay AI Inc. Designed in Silicon Valley. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Charter</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Concierge</span>
            <span className="hover:text-neutral-400 cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
