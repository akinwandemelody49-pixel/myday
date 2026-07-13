import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, LogOut, LayoutDashboard, Store, Menu, X, 
  User as UserIcon, Cake, Heart, ChevronRight, Settings, Bell, Search,
  CreditCard, Briefcase, Sun, Moon
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  isDark = false,
  toggleTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getMenuItems = () => {
    const role = user.role || 'customer';
    
    if (role === 'admin') {
      return [
        {
          id: 'admin-dashboard',
          label: 'Admin Console',
          icon: <LayoutDashboard className="w-5 h-5 text-[#6C4CF1]" />,
          description: 'Platform management center'
        },
        {
          id: 'business-plan',
          label: 'Business Pitch',
          icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
          description: 'MyDay Business Blueprint'
        },
        {
          id: 'settings',
          label: 'Profile Settings',
          icon: <Settings className="w-5 h-5 text-amber-500" />,
          description: 'Update profile and capture avatar'
        }
      ];
    }
    
    if (role === 'vendor') {
      return [
        {
          id: 'vendor-dashboard',
          label: 'Vendor Console',
          icon: <LayoutDashboard className="w-5 h-5 text-emerald-500" />,
          description: 'Business & orders overview'
        },
        {
          id: 'business-plan',
          label: 'Business Pitch',
          icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
          description: 'MyDay Business Blueprint'
        },
        {
          id: 'settings',
          label: 'Profile Settings',
          icon: <Settings className="w-5 h-5 text-[#6C4CF1]" />,
          description: 'Update profile and capture avatar'
        }
      ];
    }
    
    return [
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
      },
      {
        id: 'vendor-onboarding',
        label: 'Vendor Portal',
        icon: <Briefcase className="w-5 h-5 text-[#F4B400]" />,
        description: 'Register as service provider'
      },
      {
        id: 'business-plan',
        label: 'Business Pitch',
        icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
        description: 'MyDay Business Blueprint'
      },
      {
        id: 'settings',
        label: 'Profile Settings',
        icon: <Settings className="w-5 h-5 text-[#6C4CF1]" />,
        description: 'Update profile and capture avatar'
      }
    ];
  };

  const menuItems = getMenuItems();

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-6 bg-white dark:bg-[#07070A] border-r border-neutral-100 dark:border-neutral-900 font-sans overflow-y-auto">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-50 dark:border-neutral-900">
          <div 
            onClick={() => handleTabSelect('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#6C4CF1] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-12 shadow-md shadow-[#6C4CF1]/20">
              <Cake className="w-5 h-5 text-[#F4B400]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                <span>MyDay</span>
                <span className="text-[#6C4CF1] text-xs font-mono font-bold px-1.5 py-0.5 bg-[#6C4CF1]/8 rounded-md">STUDIO</span>
              </h1>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light tracking-wide">Dynamic Birthday Magic</p>
            </div>
          </div>
          
          {/* Close button for mobile slide-out */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className="space-y-4">
          <p className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-3">
            Navigation
          </p>
          <nav className="space-y-2.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'planner' && activeTab === 'plan-wizard');
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer border ${
                    isActive 
                      ? 'bg-[#6C4CF1]/8 text-[#6C4CF1] border-[#6C4CF1]/20 shadow-2xs dark:bg-[#6C4CF1]/15 dark:text-[#8B73FF] dark:border-[#6C4CF1]/30' 
                      : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 hover:text-neutral-800 dark:hover:text-neutral-200 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`transition-all duration-300 ${isActive ? 'text-[#6C4CF1] dark:text-[#8B73FF] scale-105' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'}`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[14px] leading-tight transition-colors ${isActive ? 'font-bold text-[#6C4CF1] dark:text-[#8B73FF]' : 'font-semibold text-neutral-800 dark:text-neutral-200'}`}>{item.label}</p>
                      <p className={`text-[12px] font-medium mt-1 tracking-wide leading-relaxed transition-colors ${isActive ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'} truncate`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all ${isActive ? 'opacity-100 text-[#6C4CF1] dark:text-[#8B73FF]' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Interactive Upgrade Card inside Sidebar */}
        <div className="bg-radial from-[#6C4CF1]/8 to-transparent dark:from-[#6C4CF1]/15 border border-[#6C4CF1]/10 dark:border-[#6C4CF1]/20 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#F4B400]/10 rounded-full blur-md"></div>
          <div className="flex items-center space-x-2 text-[#6C4CF1] dark:text-[#8B73FF]">
            <Sparkles className="w-4 h-4 text-[#F4B400]" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-[#6C4CF1] dark:text-[#8B73FF]">Exclusive Active</span>
          </div>
          <h4 className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Dynamic AI Assistant</h4>
          <p className="text-[12px] text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
            Generate unlimited themes, invitations, and schedule automatic follow-ups for your guests.
          </p>
        </div>
      </div>

      {/* Theme Toggle Button Row */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100 dark:border-neutral-900">
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-500 pl-2">
            Theme Mode
          </span>
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-lg shadow-2xs border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold transition-all cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Luxury Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#6C4CF1]" />
                <span>High Contrast Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Session Profile Card at the Bottom */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 space-y-4">
        <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300">
          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100'}
            alt={user.displayName || 'Profile'}
            className="w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5 justify-between">
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight" title={user.displayName || ''}>
                {user.displayName}
              </h3>
              <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-mono font-extrabold text-[#6C4CF1] bg-[#6C4CF1]/10 px-1.5 py-0.5 rounded-md uppercase">
                <span className="w-1 h-1 rounded-full bg-[#F4B400] animate-pulse" />
                {user.role || 'customer'}
              </span>
            </div>
            <p 
              className="text-[12px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors truncate font-medium mt-1 cursor-help" 
              title={user.email || ''}
            >
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 group cursor-pointer"
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
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#07070A] border-b border-neutral-100 dark:border-neutral-900 sticky top-0 z-30 shadow-xs font-sans">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#6C4CF1] rounded-xl flex items-center justify-center">
              <Cake className="w-4 h-4 text-[#F4B400]" />
            </div>
            <span className="text-sm font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100">MyDay</span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-2">
          {/* Notifications bell */}
          <div className="relative group/bell">
            <button className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-[#6C4CF1] dark:hover:text-[#8B73FF] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-full transition-colors relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#F4B400] rounded-full border border-white dark:border-black" />
            </button>
          </div>

          <img
            src={user.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100'}
            alt={user.displayName || 'Profile'}
            className="w-8.5 h-8.5 rounded-full border border-neutral-100 dark:border-neutral-900 shadow-2xs object-cover"
            referrerPolicy="no-referrer"
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
