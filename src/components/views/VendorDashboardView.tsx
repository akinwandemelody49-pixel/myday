import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Building, MapPin, CheckCircle2, ChevronRight, 
  Upload, Loader2, ArrowRight, Phone, Mail, Store, Plus, X, 
  Trash2, ShieldCheck, Calendar, DollarSign, Image as ImageIcon, 
  AlertCircle, Star, Shield, ClipboardCheck, ArrowUpRight, Clock, ToggleLeft, Eye
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { db, auth } from '../../services/firebase';
import { 
  DBVendor, DBBooking, getVendors, updateVendor, getBookingsForVendor, updateBookingStatus, addVendor
} from '../../services/db_services';
import { SAMPLE_VENDORS } from '../../services/db';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

interface VendorDashboardViewProps {
  onGoHome: () => void;
  showNotification: (msg: string) => void;
}

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({ 
  onGoHome, 
  showNotification 
}) => {
  // Connection and Session States
  const [vendorEmail, setVendorEmail] = useState('');
  const [activeVendor, setActiveVendor] = useState<DBVendor | null>(null);
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Tab State inside Dashboard: 'bookings' | 'portfolio' | 'profile'
  const [dashboardTab, setDashboardTab] = useState<'bookings' | 'portfolio' | 'profile'>('bookings');

  // Input States for Profile & Portfolio Edit
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile States
  const [profileForm, setProfileForm] = useState({
    vendorName: '',
    description: '',
    location: '',
    phone: '',
    priceRange: 'medium' as DBVendor['priceRange'],
  });

  // Pre-seed some mock bookings in Firestore if none exist so the vendor immediately has incoming requests to manage!
  const seedMockBookingsIfEmpty = async (vendorId: string, category: string, vendorName: string) => {
    try {
      const existing = await getBookingsForVendor(vendorId);
      if (existing.length === 0) {
        console.log(`No bookings found for vendor ${vendorId}. Seeding initial realistic booking requests...`);
        
        const mockBookings: Omit<DBBooking, 'id'>[] = [
          {
            userId: 'user-sample-1',
            userName: 'Tunde Johnson',
            userEmail: 'tunde.johnson@gmail.com',
            vendorId: vendorId,
            birthdayPlanId: 'plan-sample-1',
            bookingStatus: 'pending',
            totalAmount: category === 'Venues' || category === 'Restaurants' ? 450000 : 120000,
            paymentStatus: 'unpaid',
            bookingDate: '2026-07-25',
            specialRequests: 'Would love an elegant setup with a custom gold-gilded entrance and soft ambient lighting.',
            createdAt: new Date().toISOString()
          },
          {
            userId: 'user-sample-2',
            userName: 'Amina Kwara',
            userEmail: 'amina.k@kwaran.org',
            vendorId: vendorId,
            birthdayPlanId: 'plan-sample-2',
            bookingStatus: 'confirmed',
            totalAmount: category === 'Venues' || category === 'Restaurants' ? 380000 : 95000,
            paymentStatus: 'paid',
            bookingDate: '2026-08-05',
            specialRequests: 'Allergy alert: Ensure all ingredients or material handles are strictly non-toxic/organic. Guests are very specific.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            userId: 'user-sample-3',
            userName: 'Chioma Adebayo',
            userEmail: 'chioma.adebayo@outlook.com',
            vendorId: vendorId,
            birthdayPlanId: 'plan-sample-3',
            bookingStatus: 'pending',
            totalAmount: category === 'Venues' || category === 'Restaurants' ? 550000 : 150000,
            paymentStatus: 'unpaid',
            bookingDate: '2026-07-18',
            specialRequests: 'This is a surprise 30th birthday celebration. Please coordinate strictly via email and do not contact the celebrant.',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];

        for (const booking of mockBookings) {
          await setDoc(doc(collection(db, 'bookings')), booking);
        }
        
        // Re-fetch
        const freshBookings = await getBookingsForVendor(vendorId);
        setBookings(freshBookings);
        showNotification('Realistic booking requests successfully synchronized!');
      } else {
        setBookings(existing);
      }
    } catch (err) {
      console.warn('Could not seed mock bookings', err);
      // Fallback: load existing if available
      const existing = await getBookingsForVendor(vendorId);
      setBookings(existing);
    }
  };

  // Helper to resolve vendor ID or Claim approved Onboarding applications
  const handleAccessDashboard = async (emailToSearch: string) => {
    if (!emailToSearch || !emailToSearch.includes('@')) {
      showNotification('Please enter a valid business email address.');
      return;
    }

    setIsLoading(true);
    try {
      const lowercaseEmail = emailToSearch.trim().toLowerCase();
      
      // 1. Search in Firestore /vendors/ collection
      const vendorsRef = collection(db, 'vendors');
      const q = query(vendorsRef, where('email', '==', lowercaseEmail));
      const querySnapshot = await getDocs(q);
      
      let vendorDoc: DBVendor | null = null;
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        vendorDoc = { ...docSnap.data(), id: docSnap.id } as DBVendor;
      } else {
        // 2. If not found in Firestore /vendors/, check if there is an approved VendorApplication
        const appsRef = collection(db, 'vendorApplications');
        const qApps = query(appsRef, where('email', '==', lowercaseEmail));
        const appsSnapshot = await getDocs(qApps);
        
        if (!appsSnapshot.empty) {
          const appDoc = appsSnapshot.docs[0].data();
          if (appDoc.status === 'Approved') {
            // Automatically claim and create actual Vendor record in Firestore!
            showNotification('Approved onboarding application found! Deploying profile...');
            
            const categoryMapping: Record<string, DBVendor['category']> = {
              'Cake Baker': 'Cakes',
              'Photographer': 'Photographers',
              'Decorator': 'Decorators',
              'Restaurant': 'Restaurants',
              'Event Venue': 'Venues',
              'Gift Shop': 'Gift Shops',
              'Caterer': 'Restaurants',
              'Other': 'Decorators'
            };

            const mappedCategory = categoryMapping[appDoc.category] || 'Decorators';

            const newVendorPayload: Omit<DBVendor, 'id'> = {
              vendorName: appDoc.businessName,
              category: mappedCategory,
              description: appDoc.description || 'Verified local creative service provider on MyDay.',
              location: `${appDoc.city}, Kwara State`,
              images: appDoc.portfolioImages && appDoc.portfolioImages.length > 0 ? appDoc.portfolioImages : [appDoc.logo],
              phone: appDoc.phone,
              email: lowercaseEmail,
              rating: 5.0,
              priceRange: 'medium',
              verified: true,
              availabilityStatus: 'Available'
            };

            const generatedId = await addVendor(newVendorPayload);
            vendorDoc = { ...newVendorPayload, id: generatedId } as DBVendor;
            showNotification('Aesthetic vendor profile officially activated!');
          }
        }
      }

      // 3. Fallback: If not in Firestore or Approved Apps, let's search in SAMPLE_VENDORS
      if (!vendorDoc) {
        const matchedSample = SAMPLE_VENDORS.find(
          v => v.contactEmail?.toLowerCase() === lowercaseEmail || v.id === lowercaseEmail
        );

        if (matchedSample) {
          // Sync sample vendor to Firestore on-the-fly to allow real-time edits!
          showNotification('Synchronizing sample vendor profile with cloud database...');
          
          const categoryMap: Record<string, DBVendor['category']> = {
            'venue': 'Venues',
            'catering': 'Restaurants',
            'decor': 'Decorators',
            'entertainment': 'Entertainment',
            'baking': 'Cakes',
            'photography': 'Photographers'
          };

          const newVendorPayload: Omit<DBVendor, 'id'> = {
            vendorName: matchedSample.name,
            category: categoryMap[matchedSample.category] || 'Venues',
            description: matchedSample.description,
            location: matchedSample.location,
            images: [matchedSample.imageUrl],
            phone: matchedSample.contactPhone || '+234 803 123 4567',
            email: lowercaseEmail,
            rating: matchedSample.rating || 4.8,
            priceRange: matchedSample.priceRange as DBVendor['priceRange'],
            verified: true,
            availabilityStatus: 'Available'
          };

          const generatedId = matchedSample.id;
          // Set with designated ID
          await setDoc(doc(db, 'vendors', generatedId), newVendorPayload);
          vendorDoc = { ...newVendorPayload, id: generatedId } as DBVendor;
        }
      }

      if (vendorDoc) {
        setActiveVendor(vendorDoc);
        setProfileForm({
          vendorName: vendorDoc.vendorName,
          description: vendorDoc.description,
          location: vendorDoc.location,
          phone: vendorDoc.phone || '',
          priceRange: vendorDoc.priceRange,
        });

        // Load & seed bookings
        await seedMockBookingsIfEmpty(vendorDoc.id!, vendorDoc.category, vendorDoc.vendorName);
        showNotification(`Welcome back, ${vendorDoc.vendorName}!`);
      } else {
        showNotification('No active or approved vendor found with that email.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error logging in. Please check Firestore connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Availability Status directly in Firestore
  const handleUpdateAvailability = async (status: DBVendor['availabilityStatus']) => {
    if (!activeVendor || !activeVendor.id) return;
    
    setIsActionLoading('availability');
    try {
      await updateVendor(activeVendor.id, { availabilityStatus: status });
      setActiveVendor({
        ...activeVendor,
        availabilityStatus: status
      });
      showNotification(`Availability updated to "${status}" successfully!`);
    } catch (err) {
      showNotification('Could not save availability. Try again.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor || !activeVendor.id) return;

    setIsActionLoading('profile');
    try {
      await updateVendor(activeVendor.id, profileForm);
      setActiveVendor({
        ...activeVendor,
        ...profileForm
      });
      showNotification('Business profile information updated in Firestore.');
    } catch (err) {
      showNotification('Could not save profile changes.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Add Portfolio Image
  const handleAddPortfolioImage = async () => {
    if (!activeVendor || !activeVendor.id || !newImageUrl) return;

    setIsActionLoading('portfolio-add');
    try {
      const updatedImages = [...(activeVendor.images || []), newImageUrl];
      await updateVendor(activeVendor.id, { images: updatedImages });
      setActiveVendor({
        ...activeVendor,
        images: updatedImages
      });
      setNewImageUrl('');
      showNotification('Portfolio image added successfully.');
    } catch (err) {
      showNotification('Failed to add portfolio image.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Remove Portfolio Image
  const handleRemovePortfolioImage = async (indexToRemove: number) => {
    if (!activeVendor || !activeVendor.id || !activeVendor.images) return;

    setIsActionLoading(`portfolio-remove-${indexToRemove}`);
    try {
      const updatedImages = activeVendor.images.filter((_, idx) => idx !== indexToRemove);
      await updateVendor(activeVendor.id, { images: updatedImages });
      setActiveVendor({
        ...activeVendor,
        images: updatedImages
      });
      showNotification('Image removed from portfolio.');
    } catch (err) {
      showNotification('Failed to remove portfolio image.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Handle Drag & Drop / File Select portfolio uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVendor || !activeVendor.id) return;

    setIsUploading(true);
    showNotification('Processing and uploading image asset...');

    // Simulate high-fidelity upload stream
    setTimeout(async () => {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const simulatedUrl = reader.result as string;
          const updatedImages = [...(activeVendor.images || []), simulatedUrl];
          await updateVendor(activeVendor.id!, { images: updatedImages });
          setActiveVendor({
            ...activeVendor,
            images: updatedImages
          });
          setIsUploading(false);
          showNotification('Asset uploaded and compiled successfully!');
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsUploading(false);
        showNotification('File processing error.');
      }
    }, 1500);
  };

  // Manage Booking Status changes
  const handleUpdateBooking = async (bookingId: string, nextStatus: DBBooking['bookingStatus']) => {
    setIsActionLoading(bookingId);
    try {
      const nextPaymentStatus: DBBooking['paymentStatus'] = nextStatus === 'completed' ? 'paid' : 'unpaid';
      await updateBookingStatus(bookingId, nextStatus, nextPaymentStatus);
      
      // Update local state
      setBookings(prev => prev.map(b => b.id === bookingId ? { 
        ...b, 
        bookingStatus: nextStatus,
        paymentStatus: nextPaymentStatus
      } : b));

      showNotification(`Booking request successfully marked as ${nextStatus}!`);
    } catch (err) {
      showNotification('Failed to update booking status.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Statistics calculations
  const totalRevenue = bookings
    .filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'confirmed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingRequests = bookings.filter(b => b.bookingStatus === 'pending').length;
  const activeBookings = bookings.filter(b => b.bookingStatus === 'confirmed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      
      {/* 1. Gate Screen (Vendor Login / Claim) */}
      <AnimatePresence mode="wait">
        {!activeVendor ? (
          <motion.div
            key="vendor-gate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-xl mx-auto mt-8"
          >
            <Card className="border border-neutral-100/80 shadow-xl overflow-hidden bg-white">
              <div className="bg-gradient-to-br from-[#6C4CF1] to-[#5B3ED6] p-8 text-white relative">
                <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider flex items-center space-x-1 border border-white/10 font-bold">
                  <Shield className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>SECURE FIRESTORE CONSOLE</span>
                </div>
                
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <Store className="w-7 h-7 text-[#F4B400]" />
                </div>
                
                <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] tracking-tight leading-tight pt-2">
                  Vendor Partner Dashboard
                </h2>
                <p className="text-white/90 font-normal text-[16px] sm:text-[17px] mt-3 leading-relaxed">
                  Connect to your curated MyDay provider account. Manage incoming birthday celebration reservations, update your service status, and showcase your live portfolio.
                </p>
              </div>

              <CardBody className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[14px] sm:text-[15px] font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
                      Registered Business Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        placeholder="e.g. events@glasspavilion.com"
                        className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-[16px] sm:text-[17px] rounded-xl pl-12 pr-4 h-[52px] transition-all focus:outline-none placeholder-neutral-400 font-sans text-neutral-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleAccessDashboard(vendorEmail)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAccessDashboard(vendorEmail)}
                    disabled={isLoading}
                    className="w-full bg-[#6C4CF1] text-white hover:bg-[#5B3ED6] h-[52px] rounded-xl text-[16px] font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#6C4CF1]/10 flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Synchronizing Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect Business Account</span>
                        <ArrowRight className="w-4.5 h-4.5" />
                      </>
                    )}
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-neutral-100"></div>
                    <span className="flex-shrink mx-4 text-[11px] font-mono text-neutral-400 uppercase tracking-widest font-black">
                      Interactive Pre-approved Quick Fills
                    </span>
                    <div className="flex-grow border-t border-neutral-100"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'The Glass Pavilion (Venue)', email: 'events@glasspavilion.com' },
                      { name: 'Epicurean Table (Catering)', email: 'chef@epicureantable.com' },
                      { name: 'Golden Hour (Decorator)', email: 'design@goldenhourdecor.com' },
                      { name: 'Atelier de Sucre (Baking)', email: 'cakes@atelierdesucre.com' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVendorEmail(item.email);
                          handleAccessDashboard(item.email);
                        }}
                        className="text-left p-4 rounded-xl border border-neutral-100 hover:border-[#6C4CF1]/40 hover:bg-[#6C4CF1]/5 transition-all duration-200 group cursor-pointer"
                      >
                        <p className="text-[13px] sm:text-[14px] font-bold text-neutral-700 truncate group-hover:text-[#6C4CF1]">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-400 truncate mt-1">
                          {item.email}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={onGoHome}
                      className="text-[14px] sm:text-[15px] text-neutral-500 hover:text-[#6C4CF1] font-bold transition-colors cursor-pointer"
                    >
                      Back to General Portal
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          
          /* 2. Main Dashboard Panel */
          <motion.div
            key="vendor-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pb-16"
          >
            {/* Top Vendor Status Header Banner */}
            <div className="bg-white border border-neutral-100/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C4CF1]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              
              <div className="flex items-center space-x-6">
                <img
                  src={activeVendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'}
                  alt={activeVendor.vendorName}
                  className="w-24 h-24 rounded-2xl object-cover border border-neutral-100 shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
                    <h1 className="font-display font-extrabold text-[26px] sm:text-[30px] text-[#111827] tracking-tight leading-none">
                      {activeVendor.vendorName}
                    </h1>
                    {activeVendor.verified && (
                      <span className="inline-flex items-center space-x-1 bg-[#6C4CF1]/10 text-[#6C4CF1] border border-[#6C4CF1]/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                        <span>Verified Partner</span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[15px] sm:text-[16px] text-[#374151] font-semibold flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-neutral-400 shrink-0" />
                    {activeVendor.location} &bull; <span className="ml-1 font-bold text-[#6C4CF1]">{activeVendor.category}</span>
                  </p>
                  
                  <div className="flex items-center space-x-4 pt-1">
                    <span className="flex items-center text-[15px] sm:text-[16px] text-[#374151] font-bold">
                      <Star className="w-4 h-4 mr-1.5 fill-[#F4B400] text-[#F4B400]" />
                      {activeVendor.rating || '5.0'} / 5.0 Rating
                    </span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-600 font-light font-mono uppercase">
                      Price: {activeVendor.priceRange}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Availability Controller */}
              <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-100/70 md:w-80 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-[#F4B400]" />
                    Availability Status
                  </span>
                  
                  <span className={`w-2 h-2 rounded-full ${
                    activeVendor.availabilityStatus === 'Available' ? 'bg-emerald-500 animate-pulse' :
                    activeVendor.availabilityStatus === 'Fully Booked' ? 'bg-rose-500' :
                    activeVendor.availabilityStatus === 'Weekends Only' ? 'bg-amber-500 animate-pulse' :
                    'bg-neutral-400'
                  }`} />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(['Available', 'Fully Booked', 'Weekends Only', 'On Break'] as DBVendor['availabilityStatus'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateAvailability(status)}
                      className={`text-[10px] font-semibold py-2 px-2.5 rounded-xl border transition-all text-center ${
                        activeVendor.availabilityStatus === status
                          ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Stats Widget Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="border border-neutral-100 bg-white">
                <CardBody className="p-5 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Gross Revenue</p>
                    <p className="text-xl font-bold text-neutral-800 mt-1.5 font-sans">
                      ₦{totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-neutral-400 mt-0.5">From active/completed bookings</p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-neutral-100 bg-white">
                <CardBody className="p-5 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Pending Requests</p>
                    <p className="text-xl font-bold text-neutral-800 mt-1.5">
                      {pendingRequests} Requests
                    </p>
                    <p className="text-[9px] text-neutral-400 mt-0.5">Awaiting business decision</p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-neutral-100 bg-white">
                <CardBody className="p-5 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Confirmed Bookings</p>
                    <p className="text-xl font-bold text-neutral-800 mt-1.5">
                      {activeBookings} Bookings
                    </p>
                    <p className="text-[9px] text-neutral-400 mt-0.5">Currently on plan calendar</p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-neutral-100 bg-white">
                <CardBody className="p-5 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#6C4CF1]/10 text-[#6C4CF1] rounded-2xl flex items-center justify-center">
                    <Star className="w-5 h-5 fill-[#F4B400] text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Reputation Index</p>
                    <p className="text-xl font-bold text-neutral-800 mt-1.5">
                      {activeVendor.rating ? `${activeVendor.rating} Rating` : '5.0 Verified'}
                    </p>
                    <p className="text-[9px] text-neutral-400 mt-0.5">Based on client review metrics</p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Dashboard Workspace Layout: Left Tabs Navigation, Right Workspace Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column Sidebar Navigation */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-neutral-100 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="block px-3 text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    WORKSPACE CHANNELS
                  </span>
                  
                  <button
                    onClick={() => setDashboardTab('bookings')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      dashboardTab === 'bookings'
                        ? 'bg-[#6C4CF1] text-white'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking Requests
                    </span>
                    {pendingRequests > 0 && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        dashboardTab === 'bookings' ? 'bg-white text-[#6C4CF1]' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {pendingRequests} NEW
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setDashboardTab('portfolio')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      dashboardTab === 'portfolio'
                        ? 'bg-[#6C4CF1] text-white'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Portfolio Images
                  </button>

                  <button
                    onClick={() => setDashboardTab('profile')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      dashboardTab === 'profile'
                        ? 'bg-[#6C4CF1] text-white'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Business Profile
                  </button>
                </div>

                {/* Database Info Box */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-5 border border-neutral-800 space-y-4">
                  <div className="flex items-center space-x-2 text-[#F4B400] text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>FIRESTORE OPERATIONAL</span>
                  </div>
                  <p className="text-[11px] text-white/70 font-light leading-relaxed">
                    This partner console synchronizes dynamically with your live Firestore databases. Acceptances or cancellations update user notification feeds immediately.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveVendor(null);
                        setBookings([]);
                        setVendorEmail('');
                        showNotification('Disconnected securely from database.');
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-colors border border-white/10"
                    >
                      Disconnect Partner
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column Core Functional Panels */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: Booking Requests */}
                  {dashboardTab === 'bookings' && (
                    <motion.div
                      key="tab-bookings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display font-bold text-lg text-neutral-800">
                            Client Celebration Bookings
                          </h2>
                          <p className="text-xs text-neutral-500 font-light">
                            View client-requested services and dates. Complete bookings to collect revenue.
                          </p>
                        </div>
                      </div>

                      {bookings.length === 0 ? (
                        <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center space-y-3">
                          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto" />
                          <h4 className="font-bold text-sm text-neutral-800">No incoming bookings yet</h4>
                          <p className="text-xs text-neutral-400 max-w-sm mx-auto font-light leading-normal">
                            Once customers orchestrate birthday plans on MyDay and select your services, their booking orders will display instantly here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map((booking) => (
                            <Card 
                              key={booking.id} 
                              className={`border bg-white transition-all duration-200 ${
                                booking.bookingStatus === 'pending' ? 'border-amber-200 shadow-sm shadow-amber-500/5' :
                                booking.bookingStatus === 'confirmed' ? 'border-blue-100' :
                                'border-neutral-100'
                              }`}
                            >
                              <CardBody className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-neutral-50">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-500 uppercase">
                                        INV-{booking.id?.toUpperCase().slice(0, 8)}
                                      </span>
                                      
                                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        booking.bookingStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                                        booking.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                        booking.bookingStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-rose-100 text-rose-800'
                                      }`}>
                                        {booking.bookingStatus}
                                      </span>
                                    </div>
                                    
                                    <h3 className="font-display font-bold text-base text-neutral-800 mt-2">
                                      {booking.userName || 'Premium Client'}
                                    </h3>
                                    <p className="text-xs text-neutral-400 font-light font-sans mt-0.5">
                                      Client contact: <span className="font-semibold text-neutral-600">{booking.userEmail}</span>
                                    </p>
                                  </div>

                                  <div className="text-right md:text-right shrink-0">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Est. Payout</p>
                                    <p className="text-lg font-bold text-[#6C4CF1]">
                                      ₦{booking.totalAmount.toLocaleString()}
                                    </p>
                                    <p className={`text-[9px] font-semibold mt-1 ${
                                      booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-neutral-400'
                                    }`}>
                                      Payment Status: {booking.paymentStatus.toUpperCase()}
                                    </p>
                                  </div>
                                </div>

                                {/* Body / Requirements of Booking */}
                                <div className="py-4 space-y-3.5">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                                      <div>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase leading-none">Event Date</p>
                                        <p className="text-xs font-semibold text-neutral-700 mt-1">
                                          {new Date(booking.bookingDate).toLocaleDateString(undefined, {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Sparkles className="w-4 h-4 text-neutral-400 shrink-0" />
                                      <div>
                                        <p className="text-[9px] font-bold text-[#6C4CF1] uppercase leading-none">Unified Plan Code</p>
                                        <p className="text-xs font-mono text-neutral-700 mt-1">
                                          {booking.birthdayPlanId.toUpperCase().slice(0, 12)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {booking.specialRequests && (
                                    <div className="bg-neutral-50/70 rounded-xl p-3.5 border border-neutral-100">
                                      <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Special Client Instructions</p>
                                      <p className="text-xs text-neutral-600 font-light leading-relaxed">
                                        "{booking.specialRequests}"
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Booking action triggers */}
                                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-neutral-50">
                                  {booking.bookingStatus === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                        disabled={isActionLoading === booking.id}
                                        className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Decline Request
                                      </button>
                                      <button
                                        onClick={() => handleUpdateBooking(booking.id!, 'confirmed')}
                                        disabled={isActionLoading === booking.id}
                                        className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center cursor-pointer"
                                      >
                                        {isActionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                        Accept & Confirm
                                      </button>
                                    </>
                                  )}

                                  {booking.bookingStatus === 'confirmed' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                        disabled={isActionLoading === booking.id}
                                        className="px-3.5 py-1.5 text-neutral-400 hover:text-rose-500 hover:bg-neutral-50 rounded-xl text-xs transition-colors cursor-pointer"
                                      >
                                        Cancel Booking
                                      </button>
                                      <button
                                        onClick={() => handleUpdateBooking(booking.id!, 'completed')}
                                        disabled={isActionLoading === booking.id}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center cursor-pointer"
                                      >
                                        {isActionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                        Complete Service
                                      </button>
                                    </>
                                  )}

                                  {booking.bookingStatus === 'completed' && (
                                    <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>SERVICE FULFILLED</span>
                                    </div>
                                  )}

                                  {booking.bookingStatus === 'cancelled' && (
                                    <div className="text-neutral-400 text-xs font-medium uppercase font-mono tracking-wider">
                                      ORDER INACTIVE
                                    </div>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: Portfolio Manager */}
                  {dashboardTab === 'portfolio' && (
                    <motion.div
                      key="tab-portfolio"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="font-display font-bold text-lg text-neutral-800">
                          Portfolio Gallery Showcase
                        </h2>
                        <p className="text-xs text-neutral-500 font-light">
                          Manage files and design snapshots displayed to planning users. Upload custom images or add via static links.
                        </p>
                      </div>

                      {/* Image Addition Box */}
                      <Card className="border border-neutral-100 bg-white shadow-xs">
                        <CardBody className="p-6 space-y-4">
                          <h3 className="font-display font-bold text-sm text-neutral-800">Add New Portfolio Image</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Upload File Input */}
                            <div className="border-2 border-dashed border-neutral-200 hover:border-[#6C4CF1]/50 rounded-2xl p-6 text-center space-y-2 transition-colors relative group cursor-pointer"
                                 onClick={() => fileInputRef.current?.click()}
                            >
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                              />
                              {isUploading ? (
                                <div className="space-y-2">
                                  <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin mx-auto" />
                                  <p className="text-xs font-bold text-[#6C4CF1]">Asset Processing...</p>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-neutral-400 group-hover:text-[#6C4CF1] mx-auto transition-colors" />
                                  <p className="text-xs font-bold text-neutral-600">Select Image File</p>
                                  <p className="text-[10px] text-neutral-400 leading-normal font-light">Supports PNG, JPG, WEBP (simulated upload stream fallback)</p>
                                </>
                              )}
                            </div>

                            {/* Link Paste input */}
                            <div className="flex flex-col justify-center space-y-3.5 bg-neutral-50/50 rounded-2xl p-6 border border-neutral-100">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                                  Or Paste Direct Image Link (URL)
                                </label>
                                <input
                                  type="text"
                                  value={newImageUrl}
                                  onChange={(e) => setNewImageUrl(e.target.value)}
                                  placeholder="https://images.unsplash.com/photo-..."
                                  className="w-full bg-white border border-neutral-200 focus:border-[#6C4CF1] text-xs rounded-xl px-3 py-2.5 transition-all focus:outline-none placeholder-neutral-400 font-sans"
                                />
                              </div>
                              <Button
                                onClick={handleAddPortfolioImage}
                                disabled={isActionLoading === 'portfolio-add' || !newImageUrl}
                                className="w-full bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-neutral-800 transition-colors"
                              >
                                {isActionLoading === 'portfolio-add' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                Save Image URL
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Display Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {activeVendor.images?.map((imgUrl, index) => (
                          <div 
                            key={index}
                            className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-2xs relative group"
                          >
                            <img
                              src={imgUrl}
                              alt={`Portfolio Asset ${index + 1}`}
                              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Delete Button on Hover */}
                            <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleRemovePortfolioImage(index)}
                                disabled={isActionLoading?.startsWith('portfolio-remove')}
                                className="p-2.5 bg-white/90 rounded-full text-rose-600 hover:bg-white hover:scale-110 transition-all shadow-md cursor-pointer"
                                title="Remove Image"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                              
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-white/90 rounded-full text-neutral-700 hover:bg-white hover:scale-110 transition-all shadow-md cursor-pointer"
                                title="View Image"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </a>
                            </div>

                            {index === 0 && (
                              <span className="absolute top-3 left-3 bg-[#6C4CF1] text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider shadow-sm">
                                Cover Photo
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: Business Profile */}
                  {dashboardTab === 'profile' && (
                    <motion.div
                      key="tab-profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="font-display font-bold text-lg text-neutral-800">
                          Business Profile Details
                        </h2>
                        <p className="text-xs text-neutral-500 font-light">
                          Configure business profile fields, contacts, and descriptions cached inside Firestore.
                        </p>
                      </div>

                      <Card className="border border-neutral-100 bg-white">
                        <CardBody className="p-6">
                          <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Commercial Vendor Name
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.vendorName}
                                  onChange={(e) => setProfileForm({ ...profileForm, vendorName: e.target.value })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-xs rounded-xl px-3.5 py-3 transition-all focus:outline-none font-sans text-neutral-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Business Contact Phone
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.phone}
                                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-xs rounded-xl px-3.5 py-3 transition-all focus:outline-none font-sans text-neutral-800"
                                  placeholder="+234 803 123 4567"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Primary Location
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.location}
                                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-xs rounded-xl px-3.5 py-3 transition-all focus:outline-none font-sans text-neutral-800"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Price Index
                                </label>
                                <select
                                  value={profileForm.priceRange}
                                  onChange={(e) => setProfileForm({ ...profileForm, priceRange: e.target.value as DBVendor['priceRange'] })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-xs rounded-xl px-3.5 py-3 transition-all focus:outline-none font-sans text-neutral-700"
                                >
                                  <option value="low">Low (₦ - Budget)</option>
                                  <option value="medium">Medium (₦₦ - Fair)</option>
                                  <option value="high">High (₦₦₦ - Premium)</option>
                                  <option value="luxury">Luxury (₦₦₦₦ - Super Exclusive)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                Biography & Service Description
                              </label>
                              <textarea
                                value={profileForm.description}
                                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white text-xs rounded-xl px-3.5 py-3 transition-all focus:outline-none font-sans text-neutral-700 h-28 resize-none leading-relaxed"
                                required
                              />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2">
                              <Button
                                type="submit"
                                disabled={isActionLoading === 'profile'}
                                className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center cursor-pointer"
                              >
                                {isActionLoading === 'profile' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                Save Firestore Profile
                              </Button>
                            </div>
                          </form>
                        </CardBody>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
