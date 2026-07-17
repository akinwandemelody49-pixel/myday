import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, LogOut, ShieldCheck, Award, User as UserIcon, Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { User } from '../../types';
import { getNotifications, markNotificationAsRead, DBNotification } from '../../services/db_services';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewPlan: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  onNewPlan,
  isDark = false,
  toggleTheme,
}) => {

  const [notifications, setNotifications] = useState<DBNotification[]>([]);

  useEffect(() => {
    const fetchNavbarNotifications = async () => {
      const userId = user?.uid || 'guest';
      try {
        const data = await getNotifications(userId);
        setNotifications(data);
      } catch (err) {
        console.error("Error loading navbar notifications:", err);
      }
    };

    fetchNavbarNotifications();

    // Set up poller to fetch new notifications every 6 seconds to keep it synchronized
    const interval = setInterval(fetchNavbarNotifications, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#030303]/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900/60 shadow-xs transition-colors duration-300">
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
            <h1 className="font-display font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center leading-none">
              My<span className="text-[#6C4CF1] dark:text-[#8B73FF]">Day</span>
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
                  activeTab === 'dashboard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Dashboard
                {activeTab === 'dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* AI Planner tab */}
              <button
                onClick={() => setActiveTab('planner')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                AI Planner
                {(activeTab === 'planner' || activeTab === 'plan-wizard') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Explore Vendors tab */}
              <button
                onClick={() => setActiveTab('vendors')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendors' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendors
                {activeTab === 'vendors' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Budget Planner tab */}
              <button
                onClick={() => setActiveTab('budget-planner')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'budget-planner' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Budget Planner
                {activeTab === 'budget-planner' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Celebration Timeline tab */}
              <button
                onClick={() => setActiveTab('celebration-timeline')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'celebration-timeline' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Celebration Timeline
                {activeTab === 'celebration-timeline' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Business Pitch tab */}
              <button
                onClick={() => setActiveTab('business-plan')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'business-plan' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Business Pitch
                {activeTab === 'business-plan' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Vendor Portal tab */}
              <button
                onClick={() => setActiveTab('vendor-onboarding')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendor-onboarding' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendor Portal
                {activeTab === 'vendor-onboarding' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Vendor Dashboard tab */}
              <button
                onClick={() => setActiveTab('vendor-dashboard')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendor-dashboard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendor Dashboard
                {activeTab === 'vendor-dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleScrollTo('hero')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] transition-colors cursor-pointer py-2"
              >
                Home
              </button>
              
              <button
                onClick={() => handleScrollTo('features')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] transition-colors cursor-pointer py-2"
              >
                Features
              </button>

              <button
                onClick={() => handleScrollTo('how-it-works')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] transition-colors cursor-pointer py-2"
              >
                How It Works
              </button>

              {/* AI Planner tab - integrated cleanly */}
              <button
                onClick={() => setActiveTab('planner')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                AI Planner
                {(activeTab === 'planner' || activeTab === 'plan-wizard') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Explore Vendors tab - integrated cleanly */}
              <button
                onClick={() => setActiveTab('vendors')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendors' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendors
                {activeTab === 'vendors' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Business Pitch tab */}
              <button
                onClick={() => setActiveTab('business-plan')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'business-plan' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Business Pitch
                {activeTab === 'business-plan' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Vendor Portal tab */}
              <button
                onClick={() => setActiveTab('vendor-onboarding')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendor-onboarding' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendor Portal
                {activeTab === 'vendor-onboarding' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Vendor Dashboard tab */}
              <button
                onClick={() => setActiveTab('vendor-dashboard')}
                className={`font-sans text-[11px] uppercase tracking-widest font-bold transition-colors relative py-2 cursor-pointer ${
                  activeTab === 'vendor-dashboard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF]'
                }`}
              >
                Vendor Dashboard
                {activeTab === 'vendor-dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1] dark:bg-[#8B73FF] rounded-full" />
                )}
              </button>

              {/* Pricing Coming Soon */}
              <div className="relative group/pricing py-2">
                <span className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-400 dark:text-neutral-500 cursor-not-allowed">
                  Pricing
                </span>
                <span className="absolute -top-1 -right-8 text-[7px] font-mono font-bold bg-[#F4B400]/10 text-[#F4B400] px-1.5 py-0.5 rounded-full border border-[#F4B400]/20">
                  SOON
                </span>
              </div>

              <button
                onClick={() => handleScrollTo('footer')}
                className="font-sans text-[11px] uppercase tracking-widest font-semibold text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] transition-colors cursor-pointer py-2"
              >
                Contact
              </button>
            </>
          )}
        </nav>

        {/* Actions (Auth & Plan CTA) */}
        <div className="flex items-center space-x-4">
          
          {/* Top-Bar Theme Toggle Icon Button */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-full transition-all duration-200 cursor-pointer"
              title={isDark ? "Switch to Luxury Light Theme" : "Switch to Midnight Dark Theme"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-[#6C4CF1]" />
              )}
            </button>
          )}

          {/* User Account / Profile */}
          {user ? (
            <>
              {/* Premium Search Bar */}
              <div className="relative hidden md:block w-40 lg:w-48">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search workspace..."
                  className="w-full bg-neutral-50 hover:bg-neutral-100/70 dark:bg-neutral-900 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-950 text-xs pl-9 pr-4 py-1.5 border border-neutral-200/80 dark:border-neutral-800 focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] rounded-full transition-all focus:outline-none placeholder-neutral-400 dark:placeholder-neutral-600 font-sans text-neutral-800 dark:text-neutral-200"
                />
              </div>

              {/* Notification Bell */}
              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className="p-2 text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-full transition-colors relative cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F4B400] rounded-full border border-white dark:border-neutral-950 animate-pulse" />
                  )}
                </button>
                
                {/* Popover notifications list on hover */}
                <div className="absolute right-0 top-full mt-2 w-76 bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-xl py-3 border border-neutral-100 dark:border-neutral-900 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="px-4 pb-2 border-b border-neutral-100/60 dark:border-neutral-900 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Notifications</span>
                    {unreadCount > 0 ? (
                      <span className="text-[9px] font-mono font-bold bg-[#6C4CF1]/10 text-[#6C4CF1] px-1.5 py-0.5 rounded-full dark:bg-[#8B73FF]/15 dark:text-[#8B73FF]">{unreadCount} Unread</span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full dark:bg-neutral-900 dark:text-neutral-400">Up to date</span>
                    )}
                  </div>
                  <div className="divide-y divide-neutral-100/60 dark:divide-neutral-900 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 4).map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            if (!notif.read && notif.id) {
                              markNotificationAsRead(notif.id, user?.uid || 'guest');
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }
                            setActiveTab('notifications');
                          }}
                          className={`px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer text-left ${notif.read ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-xs leading-normal font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2">
                              {!notif.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6C4CF1] mr-1.5 mb-0.5 animate-pulse" />}
                              <strong className="font-semibold">{notif.title}: </strong>{notif.message}
                            </span>
                          </div>
                          <p className="text-[8.5px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-neutral-100/60 dark:border-neutral-900 flex justify-center">
                    <button 
                      onClick={() => setActiveTab('notifications')}
                      className="text-[10px] font-bold text-[#6C4CF1] hover:text-[#5B3ED6] dark:text-[#8B73FF] dark:hover:text-[#A18CFF] cursor-pointer bg-transparent border-0 outline-none"
                    >
                      View All in Center
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 pl-3 border-l border-neutral-100 dark:border-neutral-900">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{user.displayName}</p>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] animate-pulse" />
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono font-bold tracking-wider">PREMIUM</p>
                  </div>
                </div>
                
                <div className="relative group">
                  <img
                    src={user.photoURL || 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100'}
                    alt={user.displayName || 'User profile'}
                    className="w-10 h-10 rounded-full border border-neutral-100 dark:border-neutral-900 shadow-2xs cursor-pointer group-hover:border-[#6C4CF1] dark:group-hover:border-[#8B73FF] transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Micro dropdown menu on hover */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-950 rounded-2xl shadow-xl py-2.5 border border-neutral-100 dark:border-neutral-900 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="px-4 py-2 border-b border-neutral-50 dark:border-neutral-900">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{user.displayName}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate" title={user.email || ''}>{user.email}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-[#6C4CF1]/5 hover:text-[#6C4CF1] dark:hover:bg-neutral-900 dark:hover:text-[#8B73FF] transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-2 text-[#6C4CF1] dark:text-[#8B73FF]" />
                      My Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('planner')}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-[#6C4CF1]/5 hover:text-[#6C4CF1] dark:hover:bg-neutral-900 dark:hover:text-[#8B73FF] transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-2 text-[#6C4CF1] dark:text-[#8B73FF]" />
                      My Celebrations
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-[#6C4CF1]/5 hover:text-[#6C4CF1] dark:hover:bg-neutral-900 dark:hover:text-[#8B73FF] transition-colors flex items-center cursor-pointer font-sans"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2 text-[#6C4CF1] dark:text-[#8B73FF]" />
                      Profile Settings
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 dark:text-rose-400 transition-colors flex items-center cursor-pointer font-sans"
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
              className="px-5 py-2 border border-neutral-200 dark:border-neutral-800 hover:border-[#6C4CF1] dark:hover:border-[#8B73FF] text-neutral-800 dark:text-neutral-200 hover:text-[#6C4CF1] dark:hover:text-[#8B73FF] rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Start Planning CTA */}
          <button 
            onClick={onNewPlan} 
            className="hidden sm:inline-flex bg-[#6C4CF1] hover:bg-[#5B3ED6] dark:bg-[#6C4CF1] dark:hover:bg-[#5E3FDE] text-white px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-md shadow-[#6C4CF1]/10 hover:shadow-[#6C4CF1]/20"
          >
            Start Planning
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-100 dark:border-neutral-900 bg-white/95 dark:bg-[#030303]/95 px-4 py-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg transition-colors duration-300">
        {user ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Dashboard</span>
          </button>
        ) : (
          <button
            onClick={() => handleScrollTo('hero')}
            className={`flex flex-col items-center space-y-1 cursor-pointer ${
              activeTab === 'home' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Home</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center space-y-1 cursor-pointer ${
            activeTab === 'planner' || activeTab === 'plan-wizard' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Planner</span>
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex flex-col items-center space-y-1 cursor-pointer ${
            activeTab === 'vendors' ? 'text-[#6C4CF1] dark:text-[#8B73FF]' : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold font-sans tracking-wider uppercase">Vendors</span>
        </button>
      </div>
    </header>
  );
};
