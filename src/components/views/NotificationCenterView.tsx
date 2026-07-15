import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Mail, MessageSquare, Smartphone, Sliders, Filter, CheckSquare, Trash2, 
  Sparkles, Calendar, Circle, CheckCircle, AlertCircle, RefreshCw, X, Info, 
  HelpCircle, Settings, Send, PhoneCall
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { User } from '../../types';
import { 
  getNotifications, createNotification, markNotificationAsRead, 
  deleteNotification, markAllNotificationsAsRead, DBNotification 
} from '../../services/db_services';

interface NotificationCenterViewProps {
  user: User | null;
  showNotification: (message: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type NotificationChannel = 'all' | 'in_app' | 'email' | 'push' | 'whatsapp';
type NotificationCategory = 'all' | 'system' | 'reminder' | 'booking' | 'general';
type NotificationStatusFilter = 'all' | 'unread' | 'read';

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({
  user,
  showNotification,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>('all');
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>('all');
  
  // Preferences State
  const [preferences, setPreferences] = useState({
    inApp: true,
    email: true,
    push: false,
    whatsApp: false,
  });
  
  // Custom Simulator State
  const [simTitle, setSimTitle] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simChannel, setSimChannel] = useState<Exclude<NotificationChannel, 'all'>>('in_app');
  const [simCategory, setSimCategory] = useState<Exclude<NotificationCategory, 'all'>>('system');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Simulated outbound payloads
  const [simulatedEmail, setSimulatedEmail] = useState<{ to: string; subject: string; body: string } | null>(null);

  const userId = user?.uid || 'guest';

  // Fetch notifications
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Check existing push permission state
    if ('Notification' in window) {
      setPreferences(prev => ({
        ...prev,
        push: Notification.permission === 'granted'
      }));
    }
  }, [userId]);

  // Request Push Permission
  const handleTogglePush = async (checked: boolean) => {
    if (!checked) {
      setPreferences(prev => ({ ...prev, push: false }));
      return;
    }

    if (!('Notification' in window)) {
      showNotification("Desktop push notifications are not supported by this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, push: true }));
        showNotification("Push notifications successfully configured!");
        
        // Show demo system push
        new Notification("MyDay Birthday Planner", {
          body: "Push notification channel is now successfully connected!",
          icon: "/favicon.ico"
        });
      } else {
        setPreferences(prev => ({ ...prev, push: false }));
        showNotification("Permission denied for push notifications.");
      }
    } catch (err) {
      console.error("Error asking for push permission:", err);
      showNotification("Push permissions could not be requested inside the viewport frame.");
    }
  };

  // Create/Simulate a notification
  const handleSimulateNotification = async (
    title: string, 
    msg: string, 
    channel: Exclude<NotificationChannel, 'all'>,
    category: Exclude<NotificationCategory, 'all'>
  ) => {
    setIsSimulating(true);
    try {
      // Check if preference is enabled
      const isEnabled = 
        (channel === 'in_app' && preferences.inApp) ||
        (channel === 'email' && preferences.email) ||
        (channel === 'push' && preferences.push) ||
        (channel === 'whatsapp' && preferences.whatsApp);

      if (!isEnabled && channel !== 'whatsapp') {
        showNotification(`Notification suppressed: preference for ${channel.replace('_', ' ')} is turned off.`);
        setIsSimulating(false);
        return;
      }

      const notifData = {
        userId,
        title,
        message: msg,
        read: false,
        createdAt: new Date().toISOString(),
        type: channel,
        category: category,
      };

      await createNotification(notifData);
      await loadNotifications();

      // Trigger actual outputs based on channels
      if (channel === 'push' && preferences.push && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: msg,
          icon: user?.photoURL || undefined
        });
      }

      if (channel === 'email' && preferences.email) {
        setSimulatedEmail({
          to: user?.email || 'guest@myday.com',
          subject: `MyDay Alert: ${title}`,
          body: msg
        });
      }

      if (channel === 'whatsapp') {
        showNotification("WhatsApp simulator: WhatsApp trigger registered (queued for future integration).");
      } else {
        showNotification(`New ${channel.replace('_', ' ')} notification orchestrated!`);
      }

      // Reset form if customized
      setSimTitle('');
      setSimMessage('');
      setShowSimulator(false);
    } catch (err) {
      console.error("Failed to simulate notification:", err);
      showNotification("Failed to save simulated notification to database.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Predefined triggers to make testing extremely rich
  const quickTemplates = [
    {
      title: "🎂 Vendor Application Verified",
      message: "Congratulations! Your professional profile has been verified and labeled with the premium vendor shield.",
      channel: 'in_app' as const,
      category: 'booking' as const,
    },
    {
      title: "✨ Sarah's Birthday Theme Curated",
      message: "Our AI Engine finished processing and curated 5 bespoke styles matching your requested 'Elegant' palette.",
      channel: 'email' as const,
      category: 'system' as const,
    },
    {
      title: "🎈 Booking Accepted by 'Bubble Pop Balloons'",
      message: "Your booking deposit was verified. Decorator has locked in July 18th in Lagos for your celebration.",
      channel: 'push' as const,
      category: 'booking' as const,
    },
    {
      title: "⌛ Event Countdown: 3 Days Remaining",
      message: "Action required: Complete your catering menu draft in order to submit finalized headcount to restaurants.",
      channel: 'in_app' as const,
      category: 'reminder' as const,
    }
  ];

  // Mark single as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id, userId);
      // Fast state update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      showNotification("Notification marked as read.");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id, userId);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showNotification("Notification removed permanently.");
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id as string);
    if (unreadIds.length === 0) return;

    try {
      await markAllNotificationsAsRead(userId, unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showNotification("All notifications marked as read!");
    } catch (err) {
      console.error(err);
    }
  };

  // Filter computation
  const filteredNotifications = notifications.filter(notif => {
    const channelMatch = activeChannel === 'all' || notif.type === activeChannel;
    
    // Category check
    const categoryMatch = activeCategory === 'all' || notif.category === activeCategory;
    
    // Status check
    const statusMatch = statusFilter === 'all' || 
                        (statusFilter === 'unread' && !notif.read) || 
                        (statusFilter === 'read' && notif.read);

    return channelMatch && categoryMatch && statusMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Custom channel icon renderer
  const renderChannelIcon = (type?: string, className = "w-4 h-4") => {
    switch (type) {
      case 'email':
        return <Mail className={`${className} text-[#4285F4]`} />;
      case 'push':
        return <Smartphone className={`${className} text-[#0F9D58]`} />;
      case 'whatsapp':
        return <PhoneCall className={`${className} text-[#25D366]`} />;
      default:
        return <Bell className={`${className} text-[#6C4CF1]`} />;
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'system':
        return 'bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/15 dark:text-[#8B73FF]';
      case 'reminder':
        return 'bg-[#F4B400]/15 text-[#D09B00] dark:bg-[#F4B400]/10 dark:text-[#F4B400]';
      case 'booking':
        return 'bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/15 dark:text-[#34D399]';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8" id="notification-center">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-neutral-100 dark:border-neutral-900/60">
        <div>
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 bg-[#6C4CF1]/10 dark:bg-[#8B73FF]/15 rounded-2xl flex items-center justify-center text-[#6C4CF1] dark:text-[#8B73FF]">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
                Notification Center
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Manage, simulate, and configure delivery preferences across all orchestrated channels
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl px-4 py-2.5 flex items-center space-x-3">
            <Circle className={`w-2.5 h-2.5 ${unreadCount > 0 ? 'fill-[#F4B400] text-[#F4B400] animate-pulse' : 'text-neutral-300 dark:text-neutral-700'}`} />
            <div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{unreadCount}</span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono font-bold ml-1.5">Unread</span>
            </div>
          </div>

          <Button 
            variant="secondary" 
            size="sm"
            onClick={loadNotifications}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh database feed"
          >
            Sync feed
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
          >
            Mark all read
          </Button>
        </div>
      </div>

      {/* Grid Layout: Controls / Preferences & List Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Filters, Preferences & Simulator Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Channels Filter Card */}
          <Card variant="default">
            <CardHeader className="flex items-center space-x-2.5 py-4">
              <Sliders className="w-4 h-4 text-[#6C4CF1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Channels</span>
            </CardHeader>
            <CardBody className="p-4 space-y-1.5">
              {[
                { id: 'all', label: 'All notifications', icon: <Bell className="w-4 h-4" /> },
                { id: 'in_app', label: 'In-app feed', icon: <Bell className="w-4 h-4 text-[#6C4CF1]" /> },
                { id: 'email', label: 'Email alerts', icon: <Mail className="w-4 h-4 text-[#4285F4]" /> },
                { id: 'push', label: 'Push logs', icon: <Smartphone className="w-4 h-4 text-[#0F9D58]" /> },
                { id: 'whatsapp', label: 'WhatsApp logs', icon: <PhoneCall className="w-4 h-4 text-[#25D366]" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveChannel(item.id as NotificationChannel)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeChannel === item.id 
                    ? 'bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/15 dark:text-[#8B73FF] font-bold' 
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {activeChannel === item.id && <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CF1] dark:bg-[#8B73FF]" />}
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Preferences Config Card */}
          <Card variant="default">
            <CardHeader className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Preferences</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-amber-500 dark:bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 uppercase">Config</span>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div className="space-y-4.5">
                
                {/* In App Preference */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">In-app banners</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal mt-0.5">Toggle live application banners</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.inApp}
                    onChange={(e) => setPreferences(prev => ({ ...prev, inApp: e.target.checked }))}
                    className="w-8 h-4 rounded-full bg-neutral-200 checked:bg-[#6C4CF1] appearance-none relative transition-colors duration-200 cursor-pointer outline-none before:absolute before:w-3.5 before:h-3.5 before:rounded-full before:bg-white before:top-0.25 before:left-0.25 checked:before:translate-x-4 before:transition-transform"
                  />
                </div>

                {/* Email Preference */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Email dispatches</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal mt-0.5">Simulate outgoing transactional emails</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.email}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.checked }))}
                    className="w-8 h-4 rounded-full bg-neutral-200 checked:bg-[#4285F4] appearance-none relative transition-colors duration-200 cursor-pointer outline-none before:absolute before:w-3.5 before:h-3.5 before:rounded-full before:bg-white before:top-0.25 before:left-0.25 checked:before:translate-x-4 before:transition-transform"
                  />
                </div>

                {/* Push Preference */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Browser push</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal mt-0.5">HTML5 Web Notifications channel</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.push}
                    onChange={(e) => handleTogglePush(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-neutral-200 checked:bg-[#0F9D58] appearance-none relative transition-colors duration-200 cursor-pointer outline-none before:absolute before:w-3.5 before:h-3.5 before:rounded-full before:bg-white before:top-0.25 before:left-0.25 checked:before:translate-x-4 before:transition-transform"
                  />
                </div>

                {/* WhatsApp Preference */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      WhatsApp updates
                      <span className="text-[8px] tracking-wider font-bold bg-[#25D366]/10 text-[#25D366] px-1 py-0.25 rounded-md leading-none uppercase">Future</span>
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal mt-0.5">Enables automated reminders on WhatsApp</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={preferences.whatsApp}
                    onChange={(e) => {
                      setPreferences(prev => ({ ...prev, whatsApp: e.target.checked }));
                      if (e.target.checked) {
                        showNotification("WhatsApp channel verified! Ready for API launch.");
                      }
                    }}
                    className="w-8 h-4 rounded-full bg-neutral-200 checked:bg-[#25D366] appearance-none relative transition-colors duration-200 cursor-pointer outline-none before:absolute before:w-3.5 before:h-3.5 before:rounded-full before:bg-white before:top-0.25 before:left-0.25 checked:before:translate-x-4 before:transition-transform"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Simulate Section */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowSimulator(prev => !prev)}
              rightIcon={<span className="text-lg">{showSimulator ? '−' : '＋'}</span>}
            >
              Custom Alert Orchestrator
            </Button>

            <AnimatePresence>
              {showSimulator && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card variant="luxury">
                    <CardBody className="p-4.5 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                          Simulate Custom Alert
                        </h4>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Inject personalized transactional payloads directly into your cloud feed</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9.5px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-bold mb-1">Header Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Catering Request Finalized"
                            value={simTitle}
                            onChange={(e) => setSimTitle(e.target.value)}
                            className="w-full bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#6C4CF1]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-bold mb-1">Message Body</label>
                          <textarea 
                            placeholder="Type notification context detail..."
                            value={simMessage}
                            onChange={(e) => setSimMessage(e.target.value)}
                            rows={2}
                            className="w-full bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#6C4CF1] resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9.5px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-bold mb-1">Channel</label>
                            <select 
                              value={simChannel}
                              onChange={(e) => setSimChannel(e.target.value as any)}
                              className="w-full bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-2 py-1.5 text-[11px] text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#6C4CF1]"
                            >
                              <option value="in_app">In-App Feed</option>
                              <option value="email">Email Alert</option>
                              <option value="push">Push Log</option>
                              <option value="whatsapp">WhatsApp Log</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9.5px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-bold mb-1">Category</label>
                            <select 
                              value={simCategory}
                              onChange={(e) => setSimCategory(e.target.value as any)}
                              className="w-full bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-2 py-1.5 text-[11px] text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#6C4CF1]"
                            >
                              <option value="system">System (AI)</option>
                              <option value="reminder">Reminder</option>
                              <option value="booking">Booking / Vendor</option>
                              <option value="general">General Alert</option>
                            </select>
                          </div>
                        </div>

                        <Button 
                          variant="primary" 
                          size="sm"
                          className="w-full mt-1.5"
                          disabled={!simTitle.trim() || !simMessage.trim() || isSimulating}
                          isLoading={isSimulating}
                          onClick={() => handleSimulateNotification(simTitle, simMessage, simChannel, simCategory)}
                          leftIcon={<Send className="w-3 h-3" />}
                        >
                          Dispatch Payload
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Notification List */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* List Headers, categories & status filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#080808] border border-neutral-100 dark:border-neutral-900/60 rounded-[20px] p-4.5">
            
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All types' },
                { id: 'system', label: 'System' },
                { id: 'reminder', label: 'Reminders' },
                { id: 'booking', label: 'Bookings' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as NotificationCategory)}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] uppercase tracking-wider font-bold font-mono transition-all ${
                    activeCategory === cat.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status Selector */}
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-neutral-400">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NotificationStatusFilter)}
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs rounded-xl px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 outline-none focus:border-[#6C4CF1] font-medium"
              >
                <option value="all">All statuses</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </select>
            </div>

          </div>

          {/* Simulated Outbound Email Notification Render */}
          <AnimatePresence>
            {simulatedEmail && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative"
              >
                <div className="bg-[#4285F4]/5 dark:bg-[#4285F4]/10 border border-[#4285F4]/30 rounded-2xl p-5 relative">
                  <button 
                    onClick={() => setSimulatedEmail(null)}
                    className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-[#4285F4] shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-2 w-full">
                      <div>
                        <h4 className="text-xs font-bold text-[#4285F4] uppercase tracking-wider font-mono">SIMULATED EMAIL DISPATCH SUCCESSFUL</h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Real-time transactional email sent safely via cloud proxies</p>
                      </div>

                      <div className="bg-white dark:bg-neutral-950/80 border border-neutral-100 dark:border-neutral-900 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="border-b border-neutral-100 dark:border-neutral-900 pb-1.5 space-y-0.5">
                          <p className="text-neutral-500"><strong className="text-neutral-700 dark:text-neutral-300 font-semibold">To:</strong> {simulatedEmail.to}</p>
                          <p className="text-neutral-500"><strong className="text-neutral-700 dark:text-neutral-300 font-semibold">Subject:</strong> {simulatedEmail.subject}</p>
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-normal font-light pt-1">{simulatedEmail.body}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Simulate Presets Bar (Reduces friction for testers) */}
          <div className="bg-[#6C4CF1]/5 dark:bg-[#6C4CF1]/5 border border-[#6C4CF1]/10 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#6C4CF1] dark:text-[#8B73FF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#F4B400]" />
                Interactive Mock Generator
              </h3>
              <span className="text-[9px] font-mono font-bold text-neutral-400">1-CLICK SIMULATORS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleSimulateNotification(tpl.title, tpl.message, tpl.channel, tpl.category)}
                  className="flex items-start text-left bg-white hover:bg-neutral-50 dark:bg-[#0C0C0C] dark:hover:bg-neutral-900 border border-neutral-100 dark:border-neutral-900 rounded-xl p-2.5 transition-all text-xs group"
                >
                  <div className="mr-2.5 mt-0.5 group-hover:scale-110 transition-transform">
                    {renderChannelIcon(tpl.channel, "w-4 h-4")}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate pr-3">{tpl.title}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5 leading-snug">{tpl.message}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 text-neutral-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#6C4CF1]" />
                <p className="text-xs font-mono font-bold uppercase tracking-wider">Synchronizing Feed...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-transparent border border-neutral-100 dark:border-neutral-900/60 rounded-[30px] py-16 text-center px-6">
                <div className="w-14 h-14 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300 dark:text-neutral-700">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-neutral-800 dark:text-neutral-200">No Notifications Found</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm mx-auto mt-1 leading-normal">
                  Try triggering notifications above or modifying your active filter selection.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <div className="space-y-3">
                  {filteredNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div 
                        className={`border rounded-[20px] p-5 transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          notif.read 
                          ? 'bg-white/40 dark:bg-neutral-950/20 border-neutral-100 dark:border-neutral-900/40 opacity-70' 
                          : 'bg-white dark:bg-[#0C0C0C] border-[#6C4CF1]/15 dark:border-[#8B73FF]/15 shadow-sm shadow-[#6C4CF1]/2'
                        }`}
                      >
                        
                        {/* Core Message details */}
                        <div className="flex items-start space-x-4 max-w-xl">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.read 
                            ? 'bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400' 
                            : 'bg-[#6C4CF1]/10 text-[#6C4CF1] dark:bg-[#8B73FF]/15 dark:text-[#8B73FF]'
                          }`}>
                            {renderChannelIcon(notif.type, "w-4.5 h-4.5")}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-bold ${notif.read ? 'text-neutral-500 dark:text-neutral-400 line-through decoration-neutral-300 dark:decoration-neutral-700' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                {notif.title}
                              </h3>
                              <span className={`text-[8.5px] font-bold font-mono uppercase px-2 py-0.5 rounded-full shrink-0 tracking-wider ${getCategoryBadgeClass(notif.category)}`}>
                                {notif.category || 'general'}
                              </span>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400] shrink-0" title="Unread" />
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed font-light ${notif.read ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-600 dark:text-neutral-300'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[9px] text-neutral-400 font-mono">
                              {new Date(notif.createdAt).toLocaleString(undefined, { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Actions on card */}
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-neutral-50 dark:border-neutral-900/30 pt-3.5 sm:pt-0 w-full sm:w-auto justify-end">
                          
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id as string)}
                              className="p-2 text-[#6C4CF1] hover:text-[#5B3ED6] hover:bg-[#6C4CF1]/5 dark:text-[#8B73FF] dark:hover:text-[#A18CFF] dark:hover:bg-white/[0.03] rounded-xl transition-all cursor-pointer"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(notif.id as string)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>

                        </div>

                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
