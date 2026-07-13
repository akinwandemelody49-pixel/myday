import React, { useState } from 'react';
import { SAMPLE_VENDORS } from '../../services/db';
import { Vendor, User, BirthdayPlan } from '../../types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { SectionContainer } from '../ui/SectionContainer';
import { Star, MapPin, DollarSign, Search, Filter, Mail, Phone, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { createBooking } from '../../services/db_services';

interface VendorsViewProps {
  user?: User | null;
  plans?: BirthdayPlan[];
  onLinkVendorToPlan?: (vendor: Vendor) => void;
  activePlanName?: string;
  showNotification?: (message: string) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  user,
  plans,
  onLinkVendorToPlan,
  activePlanName,
  showNotification,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  
  // Modal states
  const [activeModalVendor, setActiveModalVendor] = useState<Vendor | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingDate, setBookingDate] = useState<string>('');

  // Filters logic
  const categories = ['all', 'venue', 'catering', 'decor', 'baking', 'entertainment', 'photography'];
  
  const filteredVendors = SAMPLE_VENDORS.filter(vendor => {
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    const matchesPrice = priceFilter === 'all' || vendor.priceRange === priceFilter;
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPrice && matchesSearch;
  });

  const getPriceBadge = (range: string) => {
    switch (range) {
      case 'low': return '$';
      case 'medium': return '$$';
      case 'high': return '$$$';
      case 'luxury': return '$$$$';
      default: return '$$';
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalVendor) return;

    setBookingLoading(true);
    try {
      let amount = 150000;
      if (activeModalVendor.priceRange === 'luxury') amount = 1200000;
      else if (activeModalVendor.priceRange === 'high') amount = 450000;
      else if (activeModalVendor.priceRange === 'medium') amount = 150000;
      else if (activeModalVendor.priceRange === 'low') amount = 50000;

      if (user) {
        await createBooking({
          userId: user.uid,
          vendorId: activeModalVendor.id,
          birthdayPlanId: plans?.[0]?.id || 'custom-plan',
          bookingStatus: 'pending',
          totalAmount: amount,
          paymentStatus: 'unpaid',
          bookingDate: bookingDate || new Date().toISOString().split('T')[0]
        });
        if (showNotification) {
          showNotification(`Successfully requested reservation with "${activeModalVendor.name}"!`);
        }
      } else {
        if (showNotification) {
          showNotification(`Reservation with "${activeModalVendor.name}" simulated (Sign in to save real bookings).`);
        }
      }
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setActiveModalVendor(null);
        setBookingDate('');
      }, 2000);
    } catch (err) {
      console.error("Booking reservation error:", err);
      if (showNotification) {
        showNotification("Failed to save booking to database. Please try again.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SectionContainer
      title="The Bespoke Vendor Network"
      subtitle="HANDPICKED EXCELLENCE"
      description="Connect directly with curated local artists, bakers, musicians, and spaces vetted to align with our high hospitality benchmarks."
      badge="Signature Directory"
      className="bg-white dark:bg-[#030303]"
    >
      {/* Search & Filters block */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search venue names, catering chefs, florists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-gold-400 px-12 h-[52px] rounded-xl text-[16px] md:text-[17px] text-neutral-800 dark:text-neutral-100 outline-none transition-colors placeholder:text-neutral-400 font-normal"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {/* Price dropdown */}
          <div className="relative flex items-center space-x-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 h-[52px] text-[15px] sm:text-[16px]">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-neutral-700 dark:text-neutral-200 font-bold"
            >
              <option value="all" className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">Price Range (All)</option>
              <option value="medium" className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">Medium ($$)</option>
              <option value="high" className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">Premium ($$$)</option>
              <option value="luxury" className="bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">Luxury ($$$$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-4 mb-8 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-full text-[14px] sm:text-[15px] font-display tracking-wide uppercase font-bold transition-all duration-300 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#6C4CF1] dark:bg-[#8B73FF] text-white border border-transparent shadow-xs'
                : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {cat === 'all' ? 'All Network' : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-400 italic">No matching boutique partners found in this filter range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} hoverEffect onClick={() => setActiveModalVendor(vendor)} variant="luxury">
              <div className="relative h-56 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={vendor.imageUrl}
                  alt={vendor.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-3 py-1 text-[10px] uppercase font-mono tracking-wider font-semibold rounded-md shadow-xs text-neutral-800 dark:text-neutral-200 border border-neutral-100/30 dark:border-neutral-800/30">
                  {vendor.category}
                </span>
                <span className="absolute bottom-4 right-4 bg-neutral-950 px-2.5 py-0.5 text-xs font-bold text-gold-300 rounded-md">
                  {getPriceBadge(vendor.priceRange)}
                </span>
              </div>
              <CardBody className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[#111827] dark:text-neutral-50 line-clamp-1 group-hover:text-gold-600 transition-colors">
                    {vendor.name}
                  </h3>
                  <div className="flex items-center text-[15px] font-bold text-gold-600 dark:text-gold-400 space-x-1.5 shrink-0">
                    <Star className="w-4.5 h-4.5 fill-gold-500 stroke-gold-500" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                <p className="text-[17px] font-sans text-[#374151] dark:text-neutral-300 line-clamp-2 leading-[1.7] font-normal">
                  {vendor.description}
                </p>

                <div className="flex items-center text-[14px] sm:text-[15px] text-[#374151] dark:text-neutral-300 font-sans space-x-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="truncate">{vendor.location}</span>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-5 text-[15px] sm:text-[16px] font-display">
                  <span className="text-neutral-400 dark:text-neutral-500 font-mono font-bold tracking-wider text-[12px]">VETTED PARTNER</span>
                  <span className="text-gold-600 dark:text-gold-400 font-bold flex items-center group-hover:underline">
                    View Portfolio <ArrowUpRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Vendor Profile & Booking Modal */}
      <Modal
        isOpen={!!activeModalVendor}
        onClose={() => setActiveModalVendor(null)}
        title={activeModalVendor?.name || 'Vendor Profile'}
        size="lg"
      >
        {activeModalVendor && (
          <div className="space-y-6">
            <div className="relative h-64 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100">
              <img
                src={activeModalVendor.imageUrl}
                alt={activeModalVendor.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1 text-xs uppercase font-mono tracking-wider font-semibold rounded-md shadow-sm">
                Category: {activeModalVendor.category}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Details */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="inline-block bg-gold-50 text-gold-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    Price Range: {activeModalVendor.priceRange.toUpperCase()}
                  </span>
                  <div className="flex items-center text-xs font-bold text-neutral-800 space-x-1">
                    <Star className="w-4 h-4 fill-gold-500 stroke-gold-500" />
                    <span>{activeModalVendor.rating} ({activeModalVendor.reviewsCount} reviews)</span>
                  </div>
                </div>

                <h4 className="font-display font-semibold text-lg text-neutral-900">About</h4>
                <p className="text-xs font-sans text-neutral-600 leading-relaxed">
                  {activeModalVendor.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-neutral-50 text-xs font-sans text-neutral-500">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    <span>Serves: {activeModalVendor.location}</span>
                  </div>
                  {activeModalVendor.contactEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gold-500" />
                      <span>{activeModalVendor.contactEmail}</span>
                    </div>
                  )}
                  {activeModalVendor.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gold-500" />
                      <span>{activeModalVendor.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linking & Concierge booking */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 h-fit space-y-4">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500">
                  Plan Synchronization
                </h5>

                {onLinkVendorToPlan && (
                  <Button
                    variant="gold"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      onLinkVendorToPlan(activeModalVendor);
                      setActiveModalVendor(null);
                    }}
                  >
                    Link to Birthday Plan
                  </Button>
                )}

                <div className="border-t border-neutral-200/50 pt-4">
                  <h5 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gold-600" /> Request Reservation
                  </h5>
                  <form onSubmit={handleBookingSubmit} className="space-y-3">
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-gold-400"
                    />
                    <Button
                      variant={bookingSuccess ? 'primary' : 'outline'}
                      type="submit"
                      className="w-full text-xs font-semibold flex items-center justify-center space-x-2"
                      disabled={bookingSuccess || bookingLoading}
                    >
                      {bookingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                      <span>{bookingSuccess ? 'Request Sent!' : 'Check Availability'}</span>
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
