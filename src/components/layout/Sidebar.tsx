import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, LogOut, LayoutDashboard, Store, Menu, X, 
  User as UserIcon, Cake, Heart, ChevronRight, Settings, Bell, Search,
  CreditCard
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Your premium overview'
    },
    {
      id: 'planner',
      label: 'AI Planner',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Manage your celebrations'
    },
    {
      id: 'vendors',
      label: 'Explore Vendors',
      icon: <Store className="w-5 h-5" />,
      description: 'Find trusted professionals'
    },
    {
      id: 'payments',
      label: 'Payment Status',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Track active bookings'
    }
  ];

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-6 bg-white border-r border-neutral-100 font-sans">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-50">
          <div 
            onClick={() => handleTabSelect('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#6C4CF1] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-12 shadow-md shadow-[#6C4CF1]/20">
              <Cake className="w-5 h-5 text-[#F4B400]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight text-neutral-800 flex items-center gap-1.5">
                <span>MyDay</span>
                <span className="text-[#6C4CF1] text-xs font-mono font-bold px-1.5 py-0.5 bg-[#6C4CF1]/8 rounded-md">STUDIO</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-light tracking-wide">Dynamic Birthday Magic</p>
            </div>
          </div>
          
          {/* Close button for mobile slide-out */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'planner' && activeTab === 'plan-wizard');
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                    isActive 
                      ? 'bg-[#6C4CF1]/8 text-[#6C4CF1] font-semibold border-l-4 border-[#6C4CF1]' 
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`transition-all duration-300 ${isActive ? 'text-[#6C4CF1] scale-105' : 'text-neutral-400 group-hover:text-neutral-700'}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-none">{item.label}</p>
                      <p className="text-[9px] text-neutral-400 font-light mt-1 tracking-wide leading-none group-hover:text-neutral-500 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all ${isActive ? 'opacity-100 text-[#6C4CF1]' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Interactive Upgrade Card inside Sidebar */}
        <div className="bg-radial from-[#6C4CF1]/8 to-transparent border border-[#6C4CF1]/10 rounded-2xl p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#F4B400]/10 rounded-full blur-md"></div>
          <div className="flex items-center space-x-2 text-[#6C4CF1]">
            <Sparkles className="w-4 h-4 text-[#F4B400]" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">Exclusive Active</span>
          </div>
          <h4 className="text-xs font-bold text-neutral-800">Dynamic AI Assistant</h4>
          <p className="text-[10px] text-neutral-500 font-light leading-relaxed">
            Generate unlimited themes, invitations, and schedule automatic follow-ups for your guests.
          </p>
        </div>
      </div>

      {/* User Session Profile Card at the Bottom */}
      <div className="pt-6 border-t border-neutral-100 space-y-4">
        <div className="flex items-center space-x-3">
          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
            alt={user.displayName || 'Profile'}
            className="w-11 h-11 rounded-2xl border border-neutral-100 shadow-2xs shrink-0"
          />
          <div className="flex-grow min-w-0">
            <h3 className="text-xs font-bold text-neutral-800 truncate leading-none mb-1">
              {user.displayName}
            </h3>
            <p className="text-[10px] text-neutral-400 truncate font-light leading-none">
              {user.email}
            </p>
            <div className="flex items-center space-x-1 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] animate-pulse" />
              <span className="text-[8px] text-neutral-400 font-mono font-bold uppercase tracking-wider">Premium Member</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100/70 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 group cursor-pointer"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Disconnect Demo</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile & Tablet Top Bar (Visible when logged in and under md screen size) */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white border-b border-neutral-100 sticky top-0 z-30 shadow-xs font-sans">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#6C4CF1] rounded-xl flex items-center justify-center">
              <Cake className="w-4 h-4 text-[#F4B400]" />
            </div>
            <span className="text-sm font-display font-black tracking-tight text-neutral-800">MyDay</span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-2">
          {/* Notifications bell */}
          <div className="relative group/bell">
            <button className="p-2 text-neutral-500 hover:text-[#6C4CF1] hover:bg-neutral-50 rounded-full transition-colors relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#F4B400] rounded-full border border-white" />
            </button>
          </div>

          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
            alt={user.displayName || 'Profile'}
            className="w-8.5 h-8.5 rounded-full border border-neutral-100 shadow-2xs"
          />
        </div>
      </div>

      {/* 2. Desktop Left Sidebar (Persistent layout on larger screens) */}
      <div className="hidden md:block w-72 h-screen sticky top-0 shrink-0 z-20">
        <SidebarContent />
      </div>

      {/* 3. Mobile slide-out drawer wrapper (Rendered with AnimatePresence for transitions) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            />

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
