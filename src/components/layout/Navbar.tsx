import React from 'react';
import { Sparkles, Calendar, LogOut, ShieldCheck, Award, User as UserIcon, Search, Bell } from 'lucide-react';
import { User } from '../../types';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewPlan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  onNewPlan,
}) => {

  const handleScrollTo = (id: string) => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => {
            if (user) {
              setActiveTab('dashboard');
            } else {
              handleScrollTo('hero');
            }
          }} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-[#6C4CF1] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:rotate-12 group-hover:scale-105 shadow-md shadow-[#6C4CF1]/20">
            <div className="w-2.5 h-2.5 bg-[#F4B400] rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-neutral-900 flex items-center leading-none">
              My<span className="text-[#6C4CF1]">Day</span>
            </h1>
            <p className="text-[7.5px] font-mono uppercase tracking-[0.25em] text-[#F4B400] mt-1 font-bold">
              AI Birthday Studio
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Links */}
        <nav className="hidden lg:flex items-center space-x-7">
          {user ? (
            <>
              {/* Dashboard tab */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'dashboard' ? 'text-[#6C4CF1]' : 'text-neutral-500 hover:text-[#6C4CF1]'
                }`}
              >
                Dashboard
                {activeTab === 'dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] rounded-full" />
                )}
              </button>

              {/* AI Planner tab */}
              <button
                onClick={() => setActiveTab('planner')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1]' : 'text-neutral-500 hover:text-[#6C4CF1]'
                }`}
              >
                AI Planner
                {(activeTab === 'planner' || activeTab === 'plan-wizard') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] rounded-full" />
                )}
              </button>

              {/* Explore Vendors tab */}
              <button
                onClick={() => setActiveTab('vendors')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendors' ? 'text-[#6C4CF1]' : 'text-neutral-500 hover:text-[#6C4CF1]'
                }`}
              >
                Vendors
                {activeTab === 'vendors' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] rounded-full" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleScrollTo('hero')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] transition-colors cursor-pointer py-2"
              >
                Home
              </button>
              
              <button
                onClick={() => handleScrollTo('features')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] transition-colors cursor-pointer py-2"
              >
                Features
              </button>

              <button
                onClick={() => handleScrollTo('how-it-works')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] transition-colors cursor-pointer py-2"
              >
                How It Works
              </button>

              {/* AI Planner tab - integrated cleanly */}
              <button
                onClick={() => setActiveTab('planner')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1]' : 'text-neutral-500 hover:text-[#6C4CF1]'
                }`}
              >
                AI Planner
                {(activeTab === 'planner' || activeTab === 'plan-wizard') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] rounded-full" />
                )}
              </button>

              {/* Explore Vendors tab - integrated cleanly */}
              <button
                onClick={() => setActiveTab('vendors')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendors' ? 'text-[#6C4CF1]' : 'text-neutral-500 hover:text-[#6C4CF1]'
                }`}
              >
                Vendors
                {activeTab === 'vendors' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] rounded-full" />
                )}
              </button>

              {/* Pricing Coming Soon */}
              <div className="relative group/pricing py-2">
                <span className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-400 cursor-not-allowed">
                  Pricing
                </span>
                <span className="absolute -top-1 -right-8 text-[7px] font-mono font-bold bg-[#F4B400]/10 text-[#F4B400] px-1.5 py-0.5 rounded-full border border-[#F4B400]/20">
                  SOON
                </span>
              </div>

              <button
                onClick={() => handleScrollTo('footer')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] transition-colors cursor-pointer py-2"
              >
                Contact
              </button>
            </>
          )}
        </nav>

        {/* Actions (Auth & Plan CTA) */}
        <div className="flex items-center space-x-4">
          
          {/* User Account / Profile */}
          {user ? (
            <>
              {/* Premium Search Bar */}
              <div className="relative hidden md:block w-40 lg:w-48">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search workspace..."
                  className="w-full bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs pl-9 pr-4 py-1.5 border border-neutral-200/80 focus:border-[#6C4CF1] rounded-full transition-all focus:outline-none placeholder-neutral-400 font-sans"
                />
              </div>

              {/* Notification Bell */}
              <div className="relative group/bell">
                <button className="p-2 text-neutral-500 hover:text-[#6C4CF1] hover:bg-neutral-50 rounded-full transition-colors relative cursor-pointer">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F4B400] rounded-full border border-white" />
                </button>
                
                {/* Popover notifications list on hover */}
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl py-3 border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="px-4 pb-2 border-b border-neutral-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Notifications</span>
                    <span className="text-[9px] font-mono font-bold bg-[#6C4CF1]/10 text-[#6C4CF1] px-1.5 py-0.5 rounded-full">3 New</span>
                  </div>
                  <div className="divide-y divide-neutral-50/50 max-h-60 overflow-y-auto">
                    <div className="px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                      <p className="text-[11px] text-neutral-700 leading-normal font-light">✨ AI curated 3 new themes for Sarah's party!</p>
                      <p className="text-[9px] text-neutral-400 font-mono mt-0.5">5m ago</p>
                    </div>
                    <div className="px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                      <p className="text-[11px] text-neutral-700 leading-normal font-light">🎉 Reminder: Jordan's birthday is in 5 days.</p>
                      <p className="text-[9px] text-neutral-400 font-mono mt-0.5">2h ago</p>
                    </div>
                    <div className="px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                      <p className="text-[11px] text-neutral-700 leading-normal font-light">🎈 Vendor 'Bubble Pop Balloons' added new catalog items.</p>
                      <p className="text-[9px] text-neutral-400 font-mono mt-0.5">1d ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 pl-3 border-l border-neutral-100">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-neutral-800">{user.displayName}</p>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] animate-pulse" />
                    <p className="text-[9px] text-neutral-400 font-mono font-bold tracking-wider">PREMIUM</p>
                  </div>
                </div>
                
                <div className="relative group">
                  <img
                    src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                    alt={user.displayName || 'User profile'}
                    className="w-10 h-10 rounded-full border border-neutral-100 shadow-2xs cursor-pointer group-hover:border-[#6C4CF1] transition-colors"
                  />
                  
                  {/* Micro dropdown menu on hover */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl py-2.5 border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="px-4 py-2 border-b border-neutral-50">
                      <p className="text-xs font-bold text-neutral-800">{user.displayName}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-600 hover:bg-[#6C4CF1]/5 hover:text-[#6C4CF1] transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-2 text-[#6C4CF1]" />
                      My Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('planner')}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-600 hover:bg-[#6C4CF1]/5 hover:text-[#6C4CF1] transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-2 text-[#6C4CF1]" />
                      My Celebrations
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Disconnect Demo
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button 
              onClick={onLogin} 
              className="px-5 py-2 border border-neutral-200 hover:border-[#6C4CF1] hover:text-[#6C4CF1] rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Start Planning CTA */}
          <button 
            onClick={onNewPlan} 
            className="hidden sm:inline-flex bg-[#6C4CF1] text-white hover:bg-[#5B3ED6] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md shadow-[#6C4CF1]/10 hover:shadow-[#6C4CF1]/20"
          >
            Start Planning
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-100 bg-white/95 px-4 py-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        {user ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#6C4CF1]' : 'text-neutral-400'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Dashboard</span>
          </button>
        ) : (
          <button
            onClick={() => handleScrollTo('hero')}
            className={`flex flex-col items-center space-y-1 cursor-pointer ${
              activeTab === 'home' ? 'text-[#6C4CF1]' : 'text-neutral-400'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Home</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center space-y-1 cursor-pointer ${
            activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1]' : 'text-neutral-400'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Planner</span>
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex flex-col items-center space-y-1 cursor-pointer ${
            activeTab === 'vendors' ? 'text-[#6C4CF1]' : 'text-neutral-400'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Vendors</span>
        </button>
      </div>
    </header>
  );
};
