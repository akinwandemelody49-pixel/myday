import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, Users, MapPin, DollarSign, Clock, ArrowLeft,
  Cake, Gift, Camera, Music, Scissors, Heart, Share2, Edit3, 
  CheckCircle, ChevronRight, AlertCircle, Info, Download, BookOpen,
  Check, Smile, HelpCircle, CreditCard, Landmark, Wallet, Percent, 
  CheckCircle2, Loader2, Phone, MessageSquare, Mail, Printer, ShieldCheck, MapPinned,
  X, Copy, AlertOctagon, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader, CardFooter } from '../ui/Card';
import { BirthdayPlan, Vendor } from '../../types';
import { SAMPLE_VENDORS } from '../../services/db';
import { auth } from '../../services/firebase';
import { logSystemActivity } from '../../services/db_services';

interface CheckoutViewProps {
  plan: BirthdayPlan | null;
  onBack: () => void;
  onNavigateTab: (tab: string) => void;
  showNotification: (message: string) => void;
}

// Interactive helper to map standard services
const VENDOR_PRICES = {
  cake: 65000,
  venue: 450000,
  photography: 180000,
  decor: 220000,
  restaurant: 120000,
  entertainment: 250000,
  gifts: 85000
};

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  plan,
  onBack,
  onNavigateTab,
  showNotification,
}) => {
  // 1. Setup default state in case no plan is passed
  const activePlan: BirthdayPlan = plan || {
    id: 'plan-default',
    userId: 'guest-user',
    celebrantName: 'Sarah',
    age: 28,
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    budget: 1200000,
    guestCount: 45,
    vibe: 'luxurious',
    interests: ['Fine Dining', 'Salsa Dancing', 'Premium Spa'],
    themeTitle: 'Royal Amethyst Gala',
    themeDescription: 'A high-society luxury evening detailed with deep velvet purples, exquisite culinary trails, live acoustic violin solos, and custom-styled champagne greetings.',
    status: 'planning',
    relationship: 'Partner',
    city: 'Lagos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. Resolve Vendors. If categories are empty, bind premium local providers from SAMPLE_VENDORS
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isSimulateFailure, setIsSimulateFailure] = useState(false);
  const [customFailReason, setCustomFailReason] = useState('insufficient_funds');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'card' | 'bank' | 'paystack' | 'flutterwave' | 'wallet'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; amount: number } | null>(null);
  const [txRef] = useState(() => 'MD-' + Math.floor(100000 + Math.random() * 900000));
  const [paymentDate] = useState(() => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Populate vendors
    const resolved: Vendor[] = [];
    const categories: ('venue' | 'catering' | 'decor' | 'entertainment' | 'photography' | 'gifts' | 'baking')[] = [
      'venue', 'catering', 'decor', 'photography', 'baking', 'entertainment'
    ];

    categories.forEach(cat => {
      // Find if activePlan has selected vendor id
      const customVendorId = activePlan.selectedVendors?.[cat];
      let vendorObj = SAMPLE_VENDORS.find(v => v.id === customVendorId || (v.category === cat && v.priceRange === 'luxury'));
      if (!vendorObj) {
        // Fallback to first available in category
        vendorObj = SAMPLE_VENDORS.find(v => v.category === cat) || SAMPLE_VENDORS[0];
      }
      if (vendorObj && !resolved.some(v => v.id === vendorObj.id)) {
        resolved.push(vendorObj);
      }
    });

    setSelectedVendors(resolved);
  }, [activePlan]);

  // 3. Pricing calculations
  const prices = {
    venue: selectedVendors.find(v => v.category === 'venue')?.priceRange === 'luxury' ? 450000 : 300000,
    catering: selectedVendors.find(v => v.category === 'catering')?.priceRange === 'luxury' ? 350000 : 200000,
    decor: selectedVendors.find(v => v.category === 'decor')?.priceRange === 'luxury' ? 220000 : 150000,
    photography: selectedVendors.find(v => v.category === 'photography')?.priceRange === 'luxury' ? 180000 : 120000,
    baking: selectedVendors.find(v => v.category === 'baking')?.priceRange === 'luxury' ? 85000 : 55000,
    entertainment: selectedVendors.find(v => v.category === 'entertainment')?.priceRange === 'luxury' ? 250000 : 150000,
  };

  const subtotal = Object.values(prices).reduce((a, b) => a + b, 0);
  const vatRate = 0.075; // 7.5%
  const serviceRate = 0.025; // 2.5%
  const platformFee = 15000; // Flat platform fee ₦15,000

  const vatAmount = Math.round(subtotal * vatRate);
  const serviceFee = Math.round(subtotal * serviceRate);
  
  // Calculate discount
  const discountAmount = appliedDiscount ? Math.round(subtotal * (appliedDiscount.percent / 100)) : 0;
  const totalAmount = subtotal + vatAmount + serviceFee + platformFee - discountAmount;

  // Currency formatting helper
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Coupon handle
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'MYDAY50' || code === 'LUXURY20' || code === ' Akinwande') {
      const pct = code === 'MYDAY50' ? 50 : 20;
      const amt = Math.round(subtotal * (pct / 100));
      setAppliedDiscount({
        code,
        percent: pct,
        amount: amt
      });
      showNotification(`Coupon "${code}" applied successfully! You saved ${formatNaira(amt)}!`);
    } else {
      showNotification("Invalid coupon code. Try 'LUXURY20' or 'MYDAY50'.");
    }
  };

  // Log failure securely to Firestore SystemActivityLogs
  const logFailureToFirestore = async (reason: string, method: string) => {
    try {
      const userEmail = auth.currentUser?.email || 'guest-user@myday.celebrations';
      const userName = auth.currentUser?.displayName || 'Guest User';
      
      await logSystemActivity({
        userEmail,
        userName,
        type: 'other',
        details: `Payment failure logged: Reference ${txRef}. Method: ${method.toUpperCase()}. Reason: ${reason}`,
        status: 'failed',
        timestamp: new Date().toISOString()
      });
      console.log("Securely logged payment failure to Firestore.");
    } catch (error) {
      console.error("Could not write payment failure log to Firestore:", error);
    }
  };

  // Payment Execution Simulator
  const handlePayment = () => {
    setIsProcessing(true);
    // Simulating API charge request with beautiful feedback steps
    setTimeout(async () => {
      setIsProcessing(false);
      
      if (isSimulateFailure) {
        setIsFailed(true);
        const reasonMap = {
          insufficient_funds: "The transaction was declined due to insufficient funds in your authorization account.",
          card_declined: "The security validation check failed. Please verify your card details (CVV/Expiry) or contact your issuer.",
          network_error: "A bank connection network timeout occurred. Please retry your payment.",
          wallet_empty: "Your MyDay luxury wallet balance is insufficient to authorize this VIP celebration ledger."
        };
        const activeReason = reasonMap[customFailReason as keyof typeof reasonMap] || "The transaction was declined by the credit card issuer.";
        
        await logFailureToFirestore(activeReason, activePaymentMethod);
        showNotification("Payment Failed. Please inspect the secure transaction ledger.");
      } else {
        setIsPaid(true);
        showNotification("Payment authorized successfully! Celebration booked.");
      }
    }, 3000);
  };

  // Print Invoice Mockup
  const handlePrint = () => {
    window.print();
  };

  // AI Itinerary Items mapped elegantly
  const timelineItems = activePlan.aiSuggestedItinerary || [
    { id: '1', time: '09:00 AM', title: 'Luxury Morning Spa Treat', description: 'Deep tissue full-body aromatherapy session at Oasis Wellness.', duration: '90 mins', location: 'Oasis SPA GRA', estimatedCost: 45000 },
    { id: '2', time: '12:30 PM', title: 'Artisanal Birthday Lunch', description: 'Curated 4-course culinary menu with champagne pairing.', duration: '2 hours', location: 'The Orchid Bistro', estimatedCost: 60000 },
    { id: '3', time: '04:00 PM', title: 'Theme Dress photoshoot', description: 'Scenic outdoor session with premium strobe lighting.', duration: '60 mins', location: 'Glasshouse Gardens', estimatedCost: 40000 },
    { id: '4', time: '07:00 PM', title: 'Main Amethyst Gala Event', description: 'Vibrant toast, saxophone rhythms, and premium cake cutting.', duration: '4 hours', location: 'The Glass Pavilion', estimatedCost: 150000 }
  ];

  if (isFailed) {
    const handleTryAgain = () => {
      setIsFailed(false);
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsPaid(true);
        showNotification("Payment authorized successfully on retry!");
      }, 2500);
    };

    const handleChooseAnotherMethod = () => {
      setIsFailed(false);
      // Let's scroll/focus on the payment card
      setTimeout(() => {
        const el = document.getElementById('payment-methods-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    };

    const handleContactSupport = () => {
      setIsSupportModalOpen(true);
    };

    const activeReason = {
      insufficient_funds: "The transaction was declined due to insufficient funds in your authorization account.",
      card_declined: "The security validation check failed. Please verify your card details (CVV/Expiry) or contact your issuer.",
      network_error: "A bank connection network timeout occurred. Please retry your payment.",
      wallet_empty: "Your MyDay luxury wallet balance is insufficient to authorize this VIP celebration ledger."
    }[customFailReason as keyof typeof activeReason] || "The transaction was declined by the credit card issuer.";

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          id="checkout-failure-view"
          className="min-h-screen bg-[#060403] text-white flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
        >
          {/* Subtle warm bronze glowing premium backgrounds */}
          <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[110px] pointer-events-none" />

          {/* Main Content Wrapper */}
          <div className="max-w-2xl w-full space-y-8 relative z-10 flex flex-col items-center">
            
            {/* Top Security Status badge */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4.5 py-2 rounded-full border border-amber-400/20"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Secure Gateway Status • Action Required</span>
            </motion.div>

            {/* Warning Crest & Main Headings */}
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-neutral-900 rounded-full text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.15)] border-[3px] border-amber-500/40 mx-auto relative"
              >
                <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/20 animate-[spin_30s_linear_infinite]" />
                <AlertOctagon className="w-12 h-12 text-amber-400 stroke-[2]" />
              </motion.div>

              <motion.div 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2.5"
              >
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display uppercase">
                  Payment Failed
                </h1>
                <p className="text-amber-500/90 text-xs sm:text-sm font-mono uppercase tracking-widest font-black max-w-lg mx-auto">
                  Transaction Authorization Unsuccessful
                </p>
              </motion.div>
            </div>

            {/* Main Failure Ledger Card */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-white text-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-100 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.08)] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 font-extrabold">Declined Transaction Details</span>
                </div>
                <span className="bg-amber-50 text-amber-850 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                  Secure Vault Offline
                </span>
              </div>

              {/* Reason Box */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 block font-black">Reason for failure</span>
                <p className="text-sm font-extrabold text-neutral-800 tracking-tight leading-snug">
                  {activeReason}
                </p>
              </div>

              {/* Helpful Message Box */}
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-150/60 text-left space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-500" /> Helpful Guidance
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
                  Do not worry—your funds have not been debited. To resolve this issue, please review your account balance, verify that your payment card details are fully up-to-date, or choose another transfer route. Our platform's luxury concierge network remains active and your celebration draft is fully saved.
                </p>
              </div>

              {/* Ledger Summary Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150/50">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400 block font-bold">Failed Reference</span>
                  <span className="font-mono text-xs font-extrabold text-neutral-700 block mt-0.5">{txRef}</span>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150/50">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400 block font-bold">Ledger Amount</span>
                  <span className="font-mono text-xs font-extrabold text-neutral-700 block mt-0.5">{formatNaira(totalAmount)}</span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons (Amber, Warning, Gold & Support Actions) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2"
            >
              {/* Button 1: Try Again */}
              <button
                onClick={handleTryAgain}
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-neutral-950 font-black h-12 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
                <span>Try Again</span>
              </button>

              {/* Button 2: Choose Another Payment Method */}
              <button
                onClick={handleChooseAnotherMethod}
                className="h-12 bg-neutral-900 hover:bg-neutral-850 border-2 border-amber-500/40 hover:border-amber-500/80 text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>Choose Another Method</span>
              </button>

              {/* Button 3: Contact Support */}
              <button
                onClick={handleContactSupport}
                className="h-12 bg-[#120D0A] hover:bg-[#1C1510] border border-amber-600/30 hover:border-amber-500/60 text-amber-400 font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Contact Support</span>
              </button>

              {/* Button 4: Return to Dashboard */}
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="h-12 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <Smile className="w-4 h-4 text-neutral-400" />
                <span>Return to Dashboard</span>
              </button>
            </motion.div>

            {/* Micro details footnote */}
            <div className="pt-4 text-center space-y-1 text-[10px] text-neutral-500 font-mono">
              <p>© 2026 MyDay Technologies Group • Secure Sandbox Ledger Gateway</p>
            </div>
          </div>

          {/* Render Support VIP Help Modal */}
          <AnimatePresence>
            {isSupportModalOpen && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white text-neutral-900 rounded-[32px] max-w-md w-full border border-neutral-100 shadow-2xl relative p-6 md:p-8 space-y-6"
                >
                  <button 
                    onClick={() => setIsSupportModalOpen(false)}
                    className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 p-2 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-1 text-center">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-2">
                      <Phone className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 tracking-tight font-display uppercase">
                      24/7 Premium Support
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium max-w-xs mx-auto">
                      Our live reservation operators are standing by to authorize your payment manually.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400 font-bold block">Direct Concierge Hotline</span>
                        <span className="font-extrabold text-neutral-800 text-sm">+234 (1) 440-MYDAY</span>
                      </div>
                      <a 
                        href="tel:+23414406932"
                        className="bg-neutral-900 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition-all"
                      >
                        Call Now
                      </a>
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-150/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400 font-bold block">VIP Dedicated Email</span>
                        <span className="font-extrabold text-neutral-800 text-sm">concierge@myday.celebrations</span>
                      </div>
                      <a 
                        href="mailto:concierge@myday.celebrations"
                        className="bg-neutral-900 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition-all"
                      >
                        Email
                      </a>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsSupportModalOpen(false)}
                    className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold h-11 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Dismiss Concierge Panel
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isPaid) {
    const handleDownloadReceipt = () => {
      setIsDownloading(true);
      showNotification("Compiling secure VIP ledger receipt...");
      setTimeout(() => {
        setIsDownloading(false);
        showNotification("Booking receipt downloaded successfully!");
        window.print();
      }, 1500);
    };

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          id="checkout-success-view"
          className="min-h-screen bg-[#030206] text-white flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative overflow-hidden"
        >
          {/* Subtle glowing luxury backgrounds */}
          <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-[#6C4CF1]/10 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[#8B73FF]/5 rounded-full blur-[110px] pointer-events-none" />

          {/* Main Success Content Wrapper */}
          <div className="max-w-4xl w-full space-y-10 relative z-10 flex flex-col items-center">
            
            {/* Top Logo / Status badge */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest text-[#8B73FF] bg-[#6C4CF1]/15 px-4.5 py-2 rounded-full border border-[#8B73FF]/25 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Celebration Plan Saved • MyDay Luxury Ledger</span>
            </motion.div>

            {/* Checkmark & Main Headings */}
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full text-emerald-500 shadow-[0_0_50px_rgba(108,76,241,0.25)] border-[3px] border-[#8B73FF] mx-auto relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#6C4CF1]/20 animate-[spin_25s_linear_infinite]" />
                <Check className="w-12 h-12 text-emerald-500 stroke-[3]" />
              </motion.div>

              <motion.div 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2.5"
              >
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-display uppercase">
                  Booking Confirmed
                </h1>
                <p className="text-[#8B73FF] text-xs sm:text-sm font-mono uppercase tracking-widest font-black max-w-lg mx-auto">
                  Payment Successful • Coordinated with Local VIP Hubs
                </p>
              </motion.div>
            </div>

            {/* White Cards Container */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full space-y-8"
            >
              {/* Card 1: Receipt Overview & Transaction Ledger */}
              <div className="bg-white text-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-100 shadow-[0_25px_60px_-15px_rgba(108,76,241,0.2)] space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-6 bg-[#6C4CF1] rounded-full" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 font-extrabold">Transaction Overview</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Authorized
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Transaction Ref */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100/80 flex flex-col justify-between relative group">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block font-bold">Transaction Reference</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-sm font-black text-neutral-800 tracking-wider">{txRef}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(txRef);
                          showNotification("Transaction reference copied!");
                        }}
                        className="text-neutral-400 hover:text-[#6C4CF1] hover:bg-neutral-100 transition-all p-1.5 rounded-lg border border-transparent"
                        title="Copy Reference"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100/80 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block font-bold">Payment Date</span>
                    <div className="flex items-center space-x-2 mt-1.5 text-neutral-800 font-extrabold text-sm">
                      <Calendar className="w-4 h-4 text-[#6C4CF1]" />
                      <span>{paymentDate}</span>
                    </div>
                  </div>

                  {/* Total Paid */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100/80 md:col-span-2 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block font-bold">Total Amount Paid</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-neutral-200/60 shadow-xs gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#6C4CF1] font-display tracking-tight">{formatNaira(totalAmount)}</span>
                      <span className="bg-purple-50 text-[#6C4CF1] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-purple-100/80 self-start sm:self-auto">
                        Premium Celebration Vault Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Booked Vendors List */}
              <div className="bg-white text-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-100 shadow-[0_25px_60px_-15px_rgba(108,76,241,0.2)] space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-6 bg-[#6C4CF1] rounded-full" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 font-extrabold">Booked Luxury Vendors</span>
                  </div>
                  <span className="text-[#6C4CF1] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-4.5 h-4.5" /> High Priority Alerted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedVendors.map((vendor, index) => {
                    const vendorPrice = prices[vendor.category as keyof typeof prices] || 120000;
                    return (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * index }}
                        className="group flex flex-col justify-between bg-neutral-50 border border-neutral-200/50 rounded-2xl p-4.5 hover:border-[#8B73FF]/40 transition-all hover:shadow-xs hover:bg-neutral-50/50"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-mono font-black tracking-widest text-[#6C4CF1] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100/60">
                              {vendor.category}
                            </span>
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-neutral-800 line-clamp-1 group-hover:text-[#6C4CF1] transition-colors">
                              {vendor.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                              {vendor.description}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-neutral-200/50 pt-3 mt-4 flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400 font-bold">Standard Fee</span>
                          <span className="text-[#6C4CF1] font-black">{formatNaira(vendorPrice)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Action Buttons (Brushed Gold and Highlights) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4"
            >
              {/* Button 1: View Dashboard (Gold, Solid) */}
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 hover:brightness-115 text-neutral-950 font-black h-12.5 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>View Dashboard</span>
              </button>

              {/* Button 2: Download Receipt (Gold Outline) */}
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                className="h-12.5 border-2 border-amber-400/80 hover:border-amber-400 hover:bg-amber-400/5 text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Download className="w-4 h-4 text-amber-300" />
                )}
                <span>{isDownloading ? "Compiling..." : "Download Receipt"}</span>
              </button>

              {/* Button 3: View Booking (Purple Highlighted Card Button) */}
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="h-12.5 bg-purple-950/40 hover:bg-purple-950/60 border-2 border-[#8B73FF]/40 hover:border-[#8B73FF] text-[#8B73FF] font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-[#8B73FF]" />
                <span>View Booking Details</span>
              </button>

              {/* Button 4: Book Another Celebration */}
              <button
                onClick={() => {
                  setIsPaid(false);
                  onNavigateTab('plan-wizard');
                }}
                className="h-12.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-400/40 text-neutral-200 font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Book Another Celebration</span>
              </button>
            </motion.div>

            {/* Micro details footnote */}
            <div className="pt-6 text-center space-y-1.5 text-[10px] text-neutral-500 font-mono">
              <p className="flex items-center justify-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Premium Celebration Vault secured. Thank you for choosing MyDay.</span>
              </p>
              <p>© 2026 MyDay Technologies Group. All rights reserved.</p>
            </div>
          </div>

          {/* Render Detail Passport Modal */}
          <AnimatePresence>
            {isBookingModalOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white text-neutral-900 rounded-[32px] max-w-2xl w-full border border-neutral-100 shadow-2xl relative p-6 md:p-8 space-y-6 my-8"
                >
                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 p-2 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-1 border-b border-neutral-100 pb-4">
                    <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#6C4CF1] bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100/60">
                      VIP Booking Passport
                    </span>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight font-display">
                      Your Coordinated Celebration
                    </h2>
                    <p className="text-xs text-neutral-500 font-medium">
                      Securely locked in and synchronized across MyDay local service hubs.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-150/60 text-xs font-semibold">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Celebrant</span>
                      <span className="text-neutral-800 text-sm font-extrabold">{activePlan.celebrantName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Date & Time</span>
                      <span className="text-neutral-800 text-sm font-extrabold">{paymentDate}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Theme Title</span>
                      <span className="text-[#6C4CF1] text-sm font-extrabold truncate block">{activePlan.themeTitle || 'Royal Bespoke Gala'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Vibe Settings</span>
                      <span className="text-amber-600 text-sm font-extrabold uppercase flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {activePlan.vibe}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-mono font-black tracking-wider text-neutral-400">Coordinated Day Itinerary</h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                      {timelineItems.map((item, index) => (
                        <div key={item.id} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-neutral-400 shrink-0 w-16 text-right">{item.time}</span>
                            {index < timelineItems.length - 1 && <div className="w-[1.5px] bg-neutral-200 grow my-1" />}
                          </div>
                          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100/70 w-full">
                            <h4 className="font-extrabold text-neutral-800">{item.title}</h4>
                            <p className="text-neutral-500 font-medium mt-0.5">{item.description}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-250/30 text-[10px] text-neutral-400">
                              <span>📍 {item.location}</span>
                              <span className="font-bold text-[#6C4CF1]">{item.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/60 space-y-2.5">
                    <h4 className="text-xs font-extrabold text-[#6C4CF1] flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> RSVP Digital Invite Link
                    </h4>
                    <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                      Send this high-tier guest portal link to your attendees. They will be directed to your customized theme dashboard where they can RSVP, specify diet preferences, and view event locations.
                    </p>
                    <div className="flex items-center space-x-2 bg-white border border-purple-100 p-2 rounded-xl">
                      <input 
                        type="text" 
                        readOnly 
                        value={`https://myday.celebrations/${activePlan.celebrantName.toLowerCase()}-${activePlan.id}`}
                        className="bg-transparent text-xs font-mono text-purple-700 w-full focus:outline-none px-2 select-all font-semibold"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://myday.celebrations/${activePlan.celebrantName.toLowerCase()}-${activePlan.id}`);
                          showNotification("RSVP digital invite link copied!");
                        }}
                        className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold h-11 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div id="checkout-root" className="min-h-screen bg-neutral-50 dark:bg-[#030303] text-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Header back controls */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-neutral-500 hover:text-[#6C4CF1] dark:text-neutral-400 dark:hover:text-[#8B73FF] font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4.5 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Plan Results</span>
          </button>
          
          <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-bold bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Premium Booking Room</span>
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="space-y-2 text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Complete Your Booking
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Review your celebration before confirming your booking. Our luxury algorithm is synchronizing your tailored timeline with selected local high-tier vendors.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE (7 columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Celebration Summary */}
            <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-100/60 dark:border-neutral-800/80 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">Celebration Summary</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">Bespoke guest configuration</p>
                </div>
                <div className="w-9 h-9 bg-[#6C4CF1]/10 dark:bg-[#8B73FF]/15 rounded-full flex items-center justify-center text-[#6C4CF1] dark:text-[#8B73FF]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardBody className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs sm:text-sm font-medium">
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Recipient Name</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold block truncate">{activePlan.celebrantName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Celebration Date</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold block">{new Date(activePlan.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Location</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#6C4CF1] dark:text-[#8B73FF] shrink-0" />
                      <span>{activePlan.city || 'Lagos, NG'}</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Guest Count</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold block flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                      <span>{activePlan.guestCount} VIPs</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Theme Title</span>
                    <span className="text-[#6C4CF1] dark:text-[#8B73FF] font-bold block truncate">{activePlan.themeTitle || 'Royal Amethyst Gala'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Design Budget</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">{formatNaira(activePlan.budget)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-100/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 p-4 rounded-xl">
                  <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold mb-1.5">Theme Description</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium italic">
                    "{activePlan.themeDescription || 'A bespoke signature luxury visual theme customized dynamically by MyDay.'}"
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* 2. Selected Vendors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">Selected Vendors</h3>
                <span className="text-[10px] font-mono text-[#6C4CF1] dark:text-[#B4A2FF] font-bold bg-[#6C4CF1]/10 dark:bg-[#8B73FF]/15 border border-[#6C4CF1]/15 dark:border-[#8B73FF]/15 px-3 py-1 rounded-full">
                  {selectedVendors.length} Luxury Providers
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVendors.map((vendor) => (
                  <Card key={vendor.id} className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col justify-between rounded-2xl">
                    <div>
                      <div className="h-40 overflow-hidden relative">
                        <img 
                          src={vendor.imageUrl} 
                          alt={vendor.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#F4B400]">
                            {vendor.category === 'baking' ? 'Cake & Treat' : vendor.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-2">
                        <h4 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 font-display tracking-tight leading-snug">{vendor.name}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal line-clamp-2">{vendor.description}</p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-neutral-50 dark:border-neutral-800/80 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center space-x-1 text-amber-500">
                        <span className="text-xs font-bold font-mono">{vendor.rating} ★</span>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[10px]">({vendor.reviewsCount})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block uppercase font-mono tracking-wider">Starting Price</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-extrabold text-xs sm:text-sm">{formatNaira(VENDOR_PRICES[vendor.category as keyof typeof VENDOR_PRICES] || 65000)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3. AI Celebration Plan */}
            <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-100/60 dark:border-neutral-800/80 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">AI Celebration Plan</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">Coordinated day-of timeline & custom cues</p>
                </div>
                <div className="w-9 h-9 bg-[#6C4CF1]/10 dark:bg-[#8B73FF]/15 rounded-full flex items-center justify-center text-[#6C4CF1] dark:text-[#8B73FF]">
                  <Clock className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardBody className="p-6 md:p-8 space-y-6">
                
                {/* Day-of timeline */}
                <div className="space-y-4">
                  <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold">Suggested Day-Of Timeline</span>
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100 dark:before:bg-neutral-800">
                    {timelineItems.map((item, index) => (
                      <div key={item.id} className="flex items-start space-x-4 pl-1 relative">
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-neutral-950 border-2 border-[#6C4CF1] dark:border-[#8B73FF] flex items-center justify-center text-[9px] text-[#6C4CF1] dark:text-[#8B73FF] font-mono font-bold shrink-0 shadow-xs z-10">
                          {index + 1}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold text-[#6C4CF1] dark:text-[#8B73FF] tracking-wider">{item.time}</span>
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">{item.title}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special notes & surprise items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="space-y-2">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                      <Heart className="w-4 h-4 text-[#6C4CF1] dark:text-[#8B73FF]" /> Special Note Highlights
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Tailor color accents of deep amethysts, customized seating cards with printed gold letter heads, and a personalized toast speech to honor milestones.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                      <Gift className="w-4 h-4 text-amber-500 animate-bounce" /> Surprise Cues
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Coordinate a flash sparkler arrival with selected musicians at 08:00 PM precisely during the cake presentation.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

          </div>

          {/* RIGHT SIDE (5 columns - Sticky Order Summary Card & Payments) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            
            {/* 1. Order Summary Card */}
            <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-100/60 dark:border-neutral-800/80 p-6">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">Order Summary</h3>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                <div className="space-y-3 text-xs sm:text-sm font-medium">
                  
                  {/* Categorized lines */}
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Cake className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Cake & treats
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.baking)}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <MapPinned className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Venue & Garden
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.venue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Photography Studio
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.photography)}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Custom Decorations
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.decor)}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Catering Services
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.catering)}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-neutral-400 dark:text-neutral-500" /> Live Band & DJs
                    </span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-bold">{formatNaira(prices.entertainment)}</span>
                  </div>

                  <div className="border-t border-neutral-100/60 dark:border-neutral-800/80 pt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[12px] text-neutral-500 dark:text-neutral-400">
                      <span>Taxes & VAT (7.5%)</span>
                      <span className="font-semibold">{formatNaira(vatAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-neutral-500 dark:text-neutral-400">
                      <span>VIP Concierge Service (2.5%)</span>
                      <span className="font-semibold">{formatNaira(serviceFee)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-neutral-500 dark:text-neutral-400">
                      <span>Platform Assurance Fee</span>
                      <span className="font-semibold">{formatNaira(platformFee)}</span>
                    </div>
                  </div>

                  {/* Coupon feedback */}
                  {appliedDiscount && (
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl flex items-center justify-between text-xs font-semibold border border-emerald-100/50 dark:border-emerald-500/10 animate-fadeIn">
                      <span className="flex items-center gap-1">
                        <Percent className="w-4 h-4" /> Coupon ({appliedDiscount.code})
                      </span>
                      <span>-{formatNaira(appliedDiscount.amount)}</span>
                    </div>
                  )}

                  <div className="border-t border-neutral-200/80 dark:border-neutral-800 pt-4 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white font-display">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-black text-[#6C4CF1] dark:text-[#8B73FF] font-display">{formatNaira(totalAmount)}</span>
                  </div>
                </div>

                {/* Promo Coupon Module */}
                <div className="pt-4 border-t border-neutral-100/60 dark:border-neutral-800/80 space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 block uppercase tracking-wider font-bold">Have a Promo Coupon?</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. LUXURY20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-grow text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-850 focus:outline-none focus:border-[#6C4CF1] dark:focus:border-[#8B73FF] font-mono tracking-widest uppercase"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      className="text-xs font-bold h-10 uppercase border-[#6C4CF1] dark:border-[#8B73FF] hover:bg-[#6C4CF1]/5 dark:hover:bg-[#8B73FF]/10 text-[#6C4CF1] dark:text-[#8B73FF] rounded-xl px-4 cursor-pointer"
                    >
                      Apply Coupon
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 2. Payment Methods */}
            <Card id="payment-methods-card" className="bg-white dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/80 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-100/60 dark:border-neutral-800/80 p-6">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">Payment Method</h3>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                
                {/* List of modern payment options with beautiful custom select highlights */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActivePaymentMethod('card')}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      activePaymentMethod === 'card' 
                        ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#8B73FF]/5 shadow-2xs' 
                        : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-[#C5A059] dark:text-amber-400 shadow-2xs">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block text-neutral-950 dark:text-neutral-100">Debit Card</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">Visa, Mastercard, Verve</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activePaymentMethod === 'card' ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {activePaymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentMethod('bank')}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      activePaymentMethod === 'bank' 
                        ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#8B73FF]/5 shadow-2xs' 
                        : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-[#C5A059] dark:text-amber-400 shadow-2xs">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block text-neutral-950 dark:text-neutral-100">Bank Transfer</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">Instant automated virtual account</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activePaymentMethod === 'bank' ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {activePaymentMethod === 'bank' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentMethod('paystack')}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      activePaymentMethod === 'paystack' 
                        ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#8B73FF]/5 shadow-2xs' 
                        : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-[#3F51B5]/10 flex items-center justify-center text-[#3F51B5] dark:text-indigo-400 font-mono font-black text-xs shadow-2xs">
                        PS
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block text-neutral-950 dark:text-neutral-100">Paystack Checkout</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">Secured with Paystack systems</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activePaymentMethod === 'paystack' ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {activePaymentMethod === 'paystack' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentMethod('flutterwave')}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      activePaymentMethod === 'flutterwave' 
                        ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#8B73FF]/5 shadow-2xs' 
                        : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FF9800]/10 flex items-center justify-center text-[#FF9800] dark:text-amber-500 font-mono font-black text-xs shadow-2xs">
                        FW
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block text-neutral-950 dark:text-neutral-100">Flutterwave</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">Pay via card, QR, or USSD</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activePaymentMethod === 'flutterwave' ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {activePaymentMethod === 'flutterwave' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentMethod('wallet')}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      activePaymentMethod === 'wallet' 
                        ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1]/5 dark:bg-[#8B73FF]/5 shadow-2xs' 
                        : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-[#C5A059] dark:text-amber-400 shadow-2xs">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block text-neutral-950 dark:text-neutral-100">MyDay Wallet</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-450 block font-bold">Balance: {formatNaira(1500000)}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activePaymentMethod === 'wallet' ? 'border-[#6C4CF1] dark:border-[#8B73FF] bg-[#6C4CF1] dark:bg-[#8B73FF]' : 'border-neutral-300 dark:border-neutral-700'}`}>
                      {activePaymentMethod === 'wallet' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                {/* Submitting Actions */}
                <div className="space-y-3 pt-4">
                  <Button
                    variant="primary"
                    disabled={isProcessing}
                    onClick={handlePayment}
                    className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] dark:bg-[#8B73FF] dark:hover:bg-[#7A5FFF] text-white font-bold h-12 rounded-xl text-xs sm:text-sm uppercase tracking-widest shadow-md shadow-[#6C4CF1]/10 flex items-center justify-center space-x-2.5 transition-all duration-300"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Authentication...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue Payment</span>
                        <ChevronRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </Button>

                  {/* Sandbox simulation tools */}
                  <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-left space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-500 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Sandbox Simulation Controls
                      </span>
                      <span className="text-[9px] text-neutral-400 font-bold font-mono">TEST HARNESS</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <label htmlFor="simulate-fail-toggle" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                        Simulate Payment Failure
                      </label>
                      <input 
                        type="checkbox"
                        id="simulate-fail-toggle"
                        checked={isSimulateFailure}
                        onChange={(e) => setIsSimulateFailure(e.target.checked)}
                        className="w-4 h-4 text-amber-500 border-neutral-300 rounded cursor-pointer focus:ring-amber-400"
                      />
                    </div>

                    {isSimulateFailure && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 block uppercase font-bold">Select Fail Reason</span>
                        <select
                          value={customFailReason}
                          onChange={(e) => setCustomFailReason(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg font-semibold focus:outline-none focus:border-amber-400"
                        >
                          <option value="insufficient_funds">Bank: Insufficient account funds</option>
                          <option value="card_declined">Issuer: Authentication challenge failed</option>
                          <option value="network_error">Gateway: Connection timeout</option>
                          <option value="wallet_empty">Wallet: Insufficient luxury savings</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        showNotification("Celebration draft saved securely for future authorization.");
                        onBack();
                      }}
                      className="h-10 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-850 dark:hover:text-white font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
                    >
                      Save for Later
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onBack}
                      className="h-10 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-850 dark:hover:text-white font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
                    >
                      Back
                    </Button>
                  </div>
                </div>

              </CardBody>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
};
