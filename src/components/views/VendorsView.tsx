import React, { useState, useEffect } from 'react';
import { SAMPLE_VENDORS } from '../../services/db';
import { Vendor, User, BirthdayPlan } from '../../types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionContainer } from '../ui/SectionContainer';
import { 
  Star, 
  MapPin, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowUpRight, 
  Loader2, 
  Heart, 
  ShieldCheck, 
  MessageSquare, 
  Check, 
  Clock, 
  DollarSign,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { createBooking } from '../../services/db_services';
import { motion, AnimatePresence } from 'motion/react';

interface VendorsViewProps {
  user?: User | null;
  plans?: BirthdayPlan[];
  onLinkVendorToPlan?: (vendor: Vendor) => void;
  activePlanName?: string;
  showNotification?: (message: string) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  user,
  plans = [],
  onLinkVendorToPlan,
  activePlanName,
  showNotification,
}) => {
  // Navigation & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  
  // Bookmarked Vendor IDs
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myday_saved_vendors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal / Detailed View State
  const [activeModalVendor, setActiveModalVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'pricing' | 'reviews'>('overview');
  
  // Form / Inquiry States
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactLoading, setContactLoading] = useState<boolean>(false);
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  // Sync plan state if multiple are available
  useEffect(() => {
    if (plans && plans.length > 0) {
      setSelectedPlanId(plans[0].id || 'custom-plan');
    } else {
      setSelectedPlanId('custom-plan');
    }
  }, [plans]);

  // Set default booking date when vendor is opened or calendar clicked
  useEffect(() => {
    if (activeModalVendor) {
      setBookingSuccess(false);
      setContactSuccess(false);
      setBookingNotes('');
      setContactMessage('');
      setActiveTab('overview');
      // Set to first available date or today
      if (activeModalVendor.availableDates && activeModalVendor.availableDates.length > 0) {
        setBookingDate(activeModalVendor.availableDates[0]);
      } else {
        setBookingDate('2026-07-15');
      }
    }
  }, [activeModalVendor]);

  // Handle Bookmarks Toggle
  const toggleSave = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    const isSaved = savedIds.includes(vendorId);
    
    if (isSaved) {
      updated = savedIds.filter(id => id !== vendorId);
      if (showNotification) showNotification('Removed from saved collection.');
    } else {
      updated = [...savedIds, vendorId];
      if (showNotification) showNotification('Saved to your premium collection!');
    }
    
    setSavedIds(updated);
    localStorage.setItem('myday_saved_vendors', JSON.stringify(updated));
  };

  // Pre-open Modal directly onto booking section
  const triggerDirectBooking = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveModalVendor(vendor);
    setTimeout(() => {
      setActiveTab('overview'); // Keeps booking panel visible on right side of overview
      // Scroll smoothly to reservation panel if on mobile
      const el = document.getElementById('reservation-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle Booking form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalVendor) return;

    setBookingLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      const planName = selectedPlan ? `${selectedPlan.recipientName}'s ${selectedPlan.age}th Birthday` : (activePlanName || 'Custom Celebration');
      const finalAmount = activeModalVendor.startingPrice || 150000;

      if (user) {
        await createBooking({
          userId: user.uid,
          vendorId: activeModalVendor.id,
          birthdayPlanId: selectedPlanId || 'custom-plan',
          bookingStatus: 'pending',
          totalAmount: finalAmount,
          paymentStatus: 'unpaid',
          bookingDate: bookingDate,
          userName: user.displayName || 'Bespoke Client',
          userEmail: user.email || 'client@myday.com',
          specialRequests: `Plan: ${planName}. Notes: ${bookingNotes}`
        });

        if (showNotification) {
          showNotification(`Booking request successfully submitted to ${activeModalVendor.name}!`);
        }
      } else {
        // Safe sandbox fallback
        if (showNotification) {
          showNotification(`Simulated Booking with ${activeModalVendor.name} for ${bookingDate}! Sign in to write to Firestore.`);
        }
      }

      setBookingSuccess(true);
      setBookingNotes('');
      setTimeout(() => {
        setBookingSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Booking submission error:', err);
      if (showNotification) {
        showNotification('Could not save reservation. Please verify internet connection.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle direct inquiry message
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalVendor || !contactMessage.trim()) return;

    setContactLoading(true);
    // Simulate premium correspondence channel with custom loader
    await new Promise(resolve => setTimeout(resolve, 1000));
    setContactLoading(false);
    setContactSuccess(true);
    setContactMessage('');
    if (showNotification) {
      showNotification(`Inquiry message transmitted to ${activeModalVendor.name}! They will reply to ${user?.email || 'your email'} shortly.`);
    }
    setTimeout(() => {
      setContactSuccess(false);
    }, 4000);
  };

  // Define All Categories dynamically
  const CATEGORIES = [
    'All',
    'Cake',
    'Photography',
    'Decor',
    'Restaurants',
    'Event Halls',
    'MC',
    'DJ',
    'Makeup Artist',
    'Gift Shops',
    'Catering'
  ];

  // Dynamic filter lists for layout selection
  const LOCATIONS = [
    { value: 'all', label: 'All Regions' },
    { value: 'GRA, Ilorin', label: 'GRA, Ilorin' },
    { value: 'Pipeline, Ilorin', label: 'Pipeline, Ilorin' },
    { value: 'Metro', label: 'Kwara State Metro' },
    { value: 'Lagos', label: 'Lagos & Kwara' }
  ];

  const BUDGETS = [
    { value: 'all', label: 'Any Pricing Tier' },
    { value: 'under-50k', label: 'Boutique (Under ₦50,000)' },
    { value: '50k-150k', label: 'Premium (₦50,000 - ₦150,000)' },
    { value: '150k-300k', label: 'Exclusive (₦150,000 - ₦300,000)' },
    { value: 'over-300k', label: 'Royal Class (₦300,000+)' }
  ];

  const RATINGS = [
    { value: 'all', label: 'Any Rating' },
    { value: '5.0', label: 'Flawless Only (5.0)' },
    { value: '4.9', label: 'Exceptional (4.9+)' },
    { value: '4.8', label: 'Highly Vetted (4.8+)' }
  ];

  // Filtering Engine
  const filteredVendors = SAMPLE_VENDORS.filter(vendor => {
    // 1. Category Filter
    const matchesCategory = selectedCategory === 'All' || 
      vendor.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // 2. Search Text Query (Names, descriptions, locations, services)
    const matchesSearch = !searchQuery.trim() || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // 3. Location Filter
    const matchesLocation = locationFilter === 'all' || 
      vendor.location.toLowerCase().includes(locationFilter.toLowerCase());

    // 4. Budget Range Filter
    let matchesBudget = true;
    if (budgetFilter !== 'all') {
      const price = vendor.startingPrice || 0;
      if (budgetFilter === 'under-50k') matchesBudget = price < 50000;
      else if (budgetFilter === '50k-150k') matchesBudget = price >= 50000 && price <= 150000;
      else if (budgetFilter === '150k-300k') matchesBudget = price >= 150000 && price <= 300000;
      else if (budgetFilter === 'over-300k') matchesBudget = price > 300000;
    }

    // 5. Rating Filter
    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const r = parseFloat(ratingFilter);
      matchesRating = vendor.rating >= r;
    }

    // 6. Bookmarked only
    const matchesSaved = !showSavedOnly || savedIds.includes(vendor.id);

    return matchesCategory && matchesSearch && matchesLocation && matchesBudget && matchesRating && matchesSaved;
  });

  // Simple Beautiful Custom Calendar Generator for July 2026
  // July 2026 starts on Wednesday (index 3). 31 Days.
  const renderCalendar = (vendor: Vendor) => {
    const daysInJuly = 31;
    const startOffset = 3; // Sun=0, Mon=1, Tue=2, Wed=3
    const calendarCells: React.ReactNode[] = [];
    
    // Weekday headers
    const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Render offsets
    for (let i = 0; i < startOffset; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Render active calendar days
    for (let day = 1; day <= daysInJuly; day++) {
      const padDay = day < 10 ? `0${day}` : `${day}`;
      const fullDateStr = `2026-07-${padDay}`;
      const isAvailable = vendor.availableDates?.includes(fullDateStr);
      const isSelected = bookingDate === fullDateStr;

      calendarCells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={!isAvailable}
          onClick={() => setBookingDate(fullDateStr)}
          className={`h-8 w-8 text-xs font-bold rounded-lg flex flex-col items-center justify-center transition-all relative ${
            isSelected
              ? 'bg-[#6C4CF1] text-white shadow-md ring-2 ring-[#6C4CF1]/20 scale-110 z-10'
              : isAvailable
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer'
              : 'text-neutral-300 dark:text-neutral-700 line-through cursor-not-allowed'
          }`}
          title={isAvailable ? 'Available for booking' : 'Fully Booked'}
        >
          <span>{day}</span>
          {isAvailable && !isSelected && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
          )}
        </button>
      );
    }

    return (
      <div className="bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-bold font-display uppercase tracking-wider text-neutral-800 dark:text-neutral-200">July 2026</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Active Calendar
          </span>
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-mono font-bold text-neutral-400">
          {headers.map(h => <div key={h}>{h}</div>)}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
          {calendarCells}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/60 pt-2.5">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mr-1.5" />
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-md bg-neutral-100 dark:bg-neutral-900 line-through text-neutral-300 mr-1.5" />
            <span>Booked</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionContainer
      title="The Bespoke Vendor Network"
      subtitle="HANDPICKED EXCELLENCE"
      description="Connect directly with curated local artists, bakers, chefs, and event halls handpicked to align with MyDay's luxury hospitality standards."
      badge="Signature Directory"
      className="bg-white dark:bg-[#030303] text-neutral-800 dark:text-neutral-100"
    >
      
      {/* 1. Category Chips Selector */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-display tracking-wide uppercase font-bold transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#6C4CF1] dark:bg-[#8B73FF] text-white border border-transparent shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Premium Grid Search & Filters */}
      <div className="bg-neutral-50 dark:bg-neutral-900/20 p-5 rounded-2xl border border-neutral-150 dark:border-neutral-800/60 mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main text query */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by vendor name, category, or specific specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 focus:border-[#6C4CF1] px-11 h-[48px] rounded-xl text-sm text-neutral-800 dark:text-neutral-100 outline-none transition-colors placeholder:text-neutral-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Location dropdown */}
            <div className="relative flex items-center bg-white dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-3 h-[48px]">
              <MapPin className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-200"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value} className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget dropdown */}
            <div className="relative flex items-center bg-white dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-3 h-[48px]">
              <DollarSign className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-200"
              >
                {BUDGETS.map(b => (
                  <option key={b.value} value={b.value} className="bg-white dark:bg-neutral-950 text-[#111827] dark:text-neutral-200">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating dropdown */}
            <div className="relative flex items-center bg-white dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-3 h-[48px]">
              <Star className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-200"
              >
                {RATINGS.map(r => (
                  <option key={r.value} value={r.value} className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Saved Only filter checkbox and stats indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-neutral-200/50 dark:border-neutral-800 gap-3">
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`flex items-center space-x-2 text-xs font-bold transition-all px-3 py-1.5 rounded-lg cursor-pointer ${
              showSavedOnly 
                ? 'bg-[#6C4CF1]/10 text-[#6C4CF1]' 
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
            }`}
          >
            <Heart className={`w-4 h-4 ${showSavedOnly ? 'fill-current text-[#6C4CF1]' : 'text-neutral-400'}`} />
            <span>Show Saved Catalog Only ({savedIds.length} saved)</span>
          </button>

          <span className="text-[11px] font-mono text-neutral-400 font-medium">
            DISPLAYING {filteredVendors.length} OF {SAMPLE_VENDORS.length} BOUTIQUE SERVICES
          </span>
        </div>
      </div>

      {/* 3. Vendor Grid List */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900/20 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">No matching boutique partners found</p>
          <p className="text-xs text-neutral-400 max-w-sm">Try widening your budget, resetting location parameters, or exploring all service categories.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setLocationFilter('all');
              setBudgetFilter('all');
              setRatingFilter('all');
              setShowSavedOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold rounded-lg transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map((vendor) => {
            const isSaved = savedIds.includes(vendor.id);
            return (
              <motion.div
                key={vendor.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <Card 
                  hoverEffect 
                  onClick={() => setActiveModalVendor(vendor)} 
                  variant="luxury"
                  className="group flex flex-col h-full bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-800/60 overflow-hidden relative"
                >
                  {/* Image, Badges & Bookmark */}
                  <div className="relative h-52 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    <img
                      src={vendor.imageUrl}
                      alt={vendor.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                    {/* Left Category tag */}
                    <span className="absolute top-4 left-4 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-bold rounded-md shadow-sm text-neutral-800 dark:text-neutral-200 border border-neutral-200/20">
                      {vendor.category}
                    </span>

                    {/* Favorite/Save Toggle Button */}
                    <button
                      onClick={(e) => toggleSave(vendor.id, e)}
                      className={`absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center transition-all bg-white/95 dark:bg-neutral-900/95 shadow-md border border-neutral-150 hover:scale-110 cursor-pointer ${
                        isSaved ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-600'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save Vendor'}
                    >
                      <Heart className={`w-4.5 h-4.5 ${isSaved ? 'fill-rose-500' : ''}`} />
                    </button>

                    {/* Overlapping Business Logo */}
                    <div className="absolute -bottom-5 left-5 h-12 w-12 rounded-full border-2 border-white dark:border-neutral-950 bg-white dark:bg-neutral-900 overflow-hidden shadow-md z-10">
                      <img 
                        src={vendor.logoUrl || vendor.imageUrl} 
                        alt={`${vendor.name} logo`} 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Rating badge */}
                    <span className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-400 rounded-md flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      <span>{vendor.rating}</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <CardBody className="p-6 pt-8 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-neutral-50 line-clamp-1 group-hover:text-[#6C4CF1] transition-colors">
                          {vendor.name}
                        </h3>
                        {vendor.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="MyDay Handpicked Verified Partner" />
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {vendor.description}
                      </p>
                    </div>

                    {/* Meta Indicators */}
                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300 pt-2 border-t border-neutral-100 dark:border-neutral-800/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{vendor.location}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-neutral-400">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{vendor.availability}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono pt-1 text-[11px]">
                        <span className="text-neutral-400 uppercase tracking-wide">Starting from</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-bold font-sans text-[13px]">
                          ₦{(vendor.startingPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Custom Button triggers */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setActiveModalVendor(vendor)}
                        className="w-full text-center py-2.5 rounded-lg border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-xs font-bold transition-all text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={(e) => triggerDirectBooking(vendor, e)}
                        className="w-full text-center py-2.5 rounded-lg bg-[#6C4CF1] hover:bg-[#5B3EDC] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Full Featured Premium Vendor Marketplace Portal Modal */}
      <Modal
        isOpen={!!activeModalVendor}
        onClose={() => setActiveModalVendor(null)}
        title={activeModalVendor?.name || 'Boutique Profile'}
        size="lg"
      >
        {activeModalVendor && (
          <div className="space-y-6">
            
            {/* Header Area with Avatar & Verified banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/60">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full border-2 border-[#6C4CF1]/20 overflow-hidden shrink-0 bg-white dark:bg-neutral-900 shadow-sm">
                  <img 
                    src={activeModalVendor.logoUrl || activeModalVendor.imageUrl} 
                    alt={activeModalVendor.name} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-neutral-50">{activeModalVendor.name}</h3>
                    {activeModalVendor.isVerified && (
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-current shrink-0" />
                        <span>VETTED PARTNER</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <span className="font-bold">{activeModalVendor.category}</span>
                    <span>•</span>
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{activeModalVendor.location}</span>
                  </div>
                </div>
              </div>

              {/* Bookmark Toggle */}
              <button
                onClick={(e) => toggleSave(activeModalVendor.id, e)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  savedIds.includes(activeModalVendor.id)
                    ? 'bg-rose-50 border-rose-100 text-rose-500'
                    : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${savedIds.includes(activeModalVendor.id) ? 'fill-current' : ''}`} />
                <span>{savedIds.includes(activeModalVendor.id) ? 'Saved' : 'Save to Catalog'}</span>
              </button>
            </div>

            {/* 2 Column Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Dynamic Tabs (Gallery, Services, Pricing, Reviews) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Visual Tab Buttons */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                  {(['overview', 'gallery', 'pricing', 'reviews'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2.5 px-4 text-xs font-bold capitalize relative cursor-pointer ${
                        activeTab === tab 
                          ? 'text-[#6C4CF1]' 
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div 
                          layoutId="activeTabUnderline" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF1]" 
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="pt-2 min-h-64">
                  <AnimatePresence mode="wait">
                    
                    {/* 1. OVERVIEW & DESCRIPTION */}
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-400">About the service</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                            {activeModalVendor.description}
                          </p>
                        </div>

                        {/* Services List */}
                        <div className="space-y-2">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-400">Services Offered</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {activeModalVendor.services?.map((svc, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-xs text-neutral-700 dark:text-neutral-300">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>{svc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Contact info card */}
                        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/60 space-y-2">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-400">Contact directly</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                            {activeModalVendor.contactEmail && (
                              <a href={`mailto:${activeModalVendor.contactEmail}`} className="flex items-center space-x-2 hover:text-[#6C4CF1] transition-colors">
                                <Mail className="w-4 h-4 text-[#6C4CF1]" />
                                <span>{activeModalVendor.contactEmail}</span>
                              </a>
                            )}
                            {activeModalVendor.contactPhone && (
                              <a href={`tel:${activeModalVendor.contactPhone}`} className="flex items-center space-x-2 hover:text-[#6C4CF1] transition-colors">
                                <Phone className="w-4 h-4 text-[#6C4CF1]" />
                                <span>{activeModalVendor.contactPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 2. GALLERY */}
                    {activeTab === 'gallery' && (
                      <motion.div
                        key="gallery"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                      >
                        {activeModalVendor.gallery?.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                            <img 
                              src={img} 
                              alt={`Portfolio view ${idx + 1}`} 
                              className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* 3. PRICING PACKAGES */}
                    {activeTab === 'pricing' && (
                      <motion.div
                        key="pricing"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {activeModalVendor.pricingTiers?.map((tier, idx) => (
                            <div 
                              key={idx} 
                              className="p-5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 flex flex-col justify-between hover:border-[#6C4CF1] transition-colors"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-display font-bold text-sm text-neutral-900 dark:text-neutral-100">{tier.name}</h5>
                                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                </div>
                                <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 font-sans">
                                  ₦{tier.price.toLocaleString()}
                                </div>
                                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                                  {tier.features.map((f, fIdx) => (
                                    <li key={fIdx} className="flex items-start">
                                      <Check className="w-3.5 h-3.5 text-[#6C4CF1] mr-1.5 shrink-0 mt-0.5" />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                onClick={() => {
                                  // Auto-fill price tier features on request notes
                                  setBookingNotes(`Requested package: ${tier.name}. Included features: ${tier.features.join(', ')}`);
                                  const el = document.getElementById('booking-date-input');
                                  if (el) el.focus();
                                  showNotification?.(`Applied package "${tier.name}" to request form notes.`);
                                }}
                                className="mt-5 w-full text-center py-2 bg-neutral-50 hover:bg-[#6C4CF1]/10 hover:text-[#6C4CF1] text-xs font-bold rounded-lg border border-neutral-150 transition-all cursor-pointer text-neutral-600 dark:text-neutral-300"
                              >
                                Select Package
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 4. REVIEWS LIST */}
                    {activeTab === 'reviews' && (
                      <motion.div
                        key="reviews"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-400">
                            Client Testimonials ({activeModalVendor.reviews?.length || 0})
                          </h4>
                          <span className="text-xs font-bold text-[#6C4CF1] flex items-center">
                            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                            {activeModalVendor.rating} overall rating
                          </span>
                        </div>

                        <div className="space-y-3.5">
                          {activeModalVendor.reviews?.map((rev, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2.5">
                                  <div className="h-8 w-8 rounded-full bg-[#6C4CF1]/10 overflow-hidden border border-neutral-150">
                                    <img 
                                      src={rev.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                                      alt={rev.author} 
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{rev.author}</h5>
                                    <span className="text-[10px] text-neutral-400 font-mono">{rev.date}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-0.5 text-xs font-bold text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span>{rev.rating}</span>
                                </div>
                              </div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 italic leading-relaxed">
                                "{rev.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>

              {/* Right Side: Sticky Mini Availability Calendar, Bookings, & Inquiries */}
              <div id="reservation-panel" className="space-y-5">
                
                {/* 1. July 2026 Interactive Calendar */}
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-400">Available Slots</h4>
                  {renderCalendar(activeModalVendor)}
                </div>

                {/* 2. Direct Sync/Book Panel */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 p-4.5 rounded-xl border border-neutral-150 dark:border-neutral-800/60 space-y-4">
                  <div className="flex items-center space-x-1.5 border-b border-neutral-200/50 dark:border-neutral-800 pb-3">
                    <Calendar className="w-4 h-4 text-[#6C4CF1] shrink-0" />
                    <h4 className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100">Send Booking Request</h4>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                    {/* Birthday Plan Sync */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">Synchronize Celebration</label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 h-[38px] rounded-lg text-xs outline-none focus:border-[#6C4CF1] text-neutral-800 dark:text-neutral-200"
                      >
                        <option value="custom-plan" className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">Custom Celebrations</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id} className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
                            {p.recipientName}'s {p.age}th Birthday
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Booking Date (synced with calendar click) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">Date selected</label>
                      <input
                        id="booking-date-input"
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 h-[38px] rounded-lg text-xs outline-none focus:border-[#6C4CF1] text-neutral-800 dark:text-neutral-200 font-bold"
                      />
                    </div>

                    {/* Special requests / Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">Special requests / notes</label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Detail custom design colors, cake flavors, diet restrictions, or sound equipment requirements..."
                        className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg text-xs outline-none focus:border-[#6C4CF1] text-neutral-800 dark:text-neutral-200 resize-none h-20"
                      />
                    </div>

                    {/* Linking action to plans */}
                    {onLinkVendorToPlan && (
                      <button
                        type="button"
                        onClick={() => {
                          onLinkVendorToPlan(activeModalVendor);
                          if (showNotification) showNotification(`Linked "${activeModalVendor.name}" into active event design panel.`);
                          setActiveModalVendor(null);
                        }}
                        className="w-full text-center py-2 border border-[#6C4CF1]/40 text-[#6C4CF1] dark:text-[#8B73FF] dark:border-[#8B73FF]/40 text-xs font-bold rounded-lg hover:bg-[#6C4CF1]/10 transition-colors cursor-pointer"
                      >
                        Design Link: Add to Active Itinerary
                      </button>
                    )}

                    <Button
                      variant={bookingSuccess ? 'primary' : 'outline'}
                      type="submit"
                      className="w-full text-xs font-bold py-2.5 flex items-center justify-center space-x-2 rounded-lg"
                      disabled={bookingSuccess || bookingLoading}
                    >
                      {bookingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : bookingSuccess ? (
                        <Check className="w-4 h-4 text-emerald-500 mr-1.5 animate-bounce" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                      )}
                      <span>{bookingSuccess ? 'Request Submitted!' : 'Confirm Reservation'}</span>
                    </Button>
                  </form>
                </div>

                {/* 3. Direct Message / Inquiry Form */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 p-4.5 rounded-xl border border-neutral-150 dark:border-neutral-800/60 space-y-3">
                  <div className="flex items-center space-x-1.5 border-b border-neutral-200/50 dark:border-neutral-800 pb-2.5">
                    <MessageSquare className="w-4 h-4 text-[#6C4CF1] shrink-0" />
                    <h4 className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100">Send Direct Message</h4>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <textarea
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={`Send a private message to ${activeModalVendor.name}...`}
                      className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg text-xs outline-none focus:border-[#6C4CF1] text-neutral-800 dark:text-neutral-200 resize-none h-16"
                    />

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full text-xs py-2"
                      disabled={contactLoading || contactSuccess}
                    >
                      {contactLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : contactSuccess ? (
                        <span>Message Dispatched!</span>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </Button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        )}
      </Modal>
    </SectionContainer>
  );
};

