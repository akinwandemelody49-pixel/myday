import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Bell, Cake, Gift, Sparkles, Camera, Utensils, Music, 
  Heart, Calendar, ChevronRight, Plus, Wand2, Bookmark, Clock, 
  ArrowUpRight, Compass, X, AlertCircle, Smile, PartyPopper, CheckCircle,
  CreditCard, Receipt, Download, FileText, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';
import { User, BirthdayPlan } from '../../types';
import { getBookings, updateBookingStatus, DBBooking } from '../../services/db_services';
import { SAMPLE_VENDORS, getFirestoreBirthdayPlans, getLocalBirthdayPlans } from '../../services/db';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface TimelineActivity {
  id: string;
  title: string;
  subtitle: string;
  type: 'ai' | 'booking' | 'catering' | 'entertainment';
  status: 'completed' | 'in_progress' | 'action_required' | 'scheduled';
  date: string;
  time: string;
  description: string;
  details: {
    label: string;
    value: string;
  }[];
  actions?: {
    label: string;
    onClick: (notify: (msg: string) => void) => void;
    primary?: boolean;
  }[];
}

const upcomingActivitiesList: TimelineActivity[] = [
  {
    id: 'timeline-1',
    title: 'Gemini AI Theme Drafting',
    subtitle: 'AI Generation Milestone',
    type: 'ai',
    status: 'completed',
    date: 'Today',
    time: '3:30 PM',
    description: 'The creative engine successfully synthesized a premium visual board and custom color palettes.',
    details: [
      { label: 'Selected Theme', value: 'Lavender-infused Whimsical Pastel Dreamscape' },
      { label: 'Assets Generated', value: '6 style references, 1 timeline blueprint' },
      { label: 'Color Hexes', value: '#6C4CF1, #F4B400, #E0D7FF' },
      { label: 'Confidence Score', value: '98% user intent match' }
    ],
    actions: [
      {
        label: 'Regenerate Board',
        onClick: (notify) => notify('AI Theme Regeneration initiated! Check your Studio panel in 10s.'),
        primary: true
      },
      {
        label: 'View Style Deck',
        onClick: (notify) => notify('Opening visual board assets deck...')
      }
    ]
  },
  {
    id: 'timeline-2',
    title: 'Royal Velvet Lounge Reservation',
    subtitle: 'Venue Booking Confirmation',
    type: 'booking',
    status: 'completed',
    date: 'July 12, 2026',
    time: '10:00 AM',
    description: 'Deposit has been fully settled and space has been certified for private occupancy.',
    details: [
      { label: 'Venue Partner', value: 'The Royal Velvet Lounge, Grand Hall B' },
      { label: 'Address', value: '404 Prestige Blvd, London EC1' },
      { label: 'Capacity Limit', value: 'Up to 120 guests fully catered' },
      { label: 'Deposit Status', value: '$450.00 secured (Tx #RD-9021)' }
    ],
    actions: [
      {
        label: 'Download Invoice',
        onClick: (notify) => notify('Initiating receipt download (Invoice #RD-9021-INV).'),
        primary: true
      },
      {
        label: 'Contact Host',
        onClick: (notify) => notify('Opening chat channel with Host Victoria.')
      }
    ]
  },
  {
    id: 'timeline-3',
    title: 'Sugar&Spice Cake Architecture',
    subtitle: 'Catering Milestone',
    type: 'catering',
    status: 'action_required',
    date: 'July 15, 2026',
    time: '1:15 PM',
    description: 'Artisanal dessert layout needs final taste selection verification from the planner.',
    details: [
      { label: 'Caterer', value: 'Sugar&Spice Patisserie' },
      { label: 'Design Theme', value: '3-tier lavender sponge with edible gold dust' },
      { label: 'Allergen Rules', value: 'Gluten-free layers verified for Tier-2' },
      { label: 'Action Needed', value: 'Confirm Tier-3 filling option before July 14' }
    ],
    actions: [
      {
        label: 'Confirm Flavor Options',
        onClick: (notify) => notify('Tier-3 Flavor confirmed: Madagascar Vanilla & Salted Caramel.'),
        primary: true
      }
    ]
  },
  {
    id: 'timeline-4',
    title: 'Interactive Retro Laser Briefing',
    subtitle: 'Entertainment Milestone',
    type: 'entertainment',
    status: 'scheduled',
    date: 'July 18, 2026',
    time: '6:00 PM',
    description: 'Setup and safety soundcheck scheduled with technical director.',
    details: [
      { label: 'Crew Partner', value: 'NeonVibe AudioVisuals' },
      { label: 'Equipment List', value: 'Laser projection, retro synthesizers, ambient fog' },
      { label: 'Soundcheck Slot', value: '60 minutes slot verified' },
      { label: 'Assigned Tech', value: 'Marcus Cole (Senior AV Specialist)' }
    ],
    actions: [
      {
        label: 'Reschedule Soundcheck',
        onClick: (notify) => notify('Opening AV Soundcheck Rescheduling calendar...')
      }
    ]
  }
];

interface DashboardViewProps {
  user: User;
  onNavigateTab: (tab: string) => void;
  onPlanBirthday: () => void;
  onBrowseVendors: () => void;
  showNotification: (message: string) => void;
  forceShowPayments?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigateTab,
  onPlanBirthday,
  onBrowseVendors,
  showNotification,
  forceShowPayments = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTab, setActivityTab] = useState<'recent' | 'upcoming'>('recent');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>('timeline-1');
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [activeSuggestionModal, setActiveSuggestionModal] = useState<boolean>(false);
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<{title: string; desc: string; icon: React.ReactNode} | null>(null);

  // Real-time booking ledgers
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<DBBooking | null>(null);

  // Real-time birthday plans
  const [plans, setPlans] = useState<BirthdayPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Fetch from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const data = await getBookings(user.uid);
        const sorted = data.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
        setBookings(sorted);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [user]);

  // Fetch plans from Firestore / local storage fallbacks
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return;
      try {
        setLoadingPlans(true);
        const data = await getFirestoreBirthdayPlans(user.uid);
        if (data && data.length > 0) {
          setPlans(data);
          setSelectedPlanId(data[0].id || '');
        } else {
          const localPlans = getLocalBirthdayPlans();
          setPlans(localPlans);
          if (localPlans.length > 0) {
            setSelectedPlanId(localPlans[0].id || '');
          }
        }
      } catch (err) {
        console.error("Failed to load plans in Dashboard:", err);
        const localPlans = getLocalBirthdayPlans();
        setPlans(localPlans);
        if (localPlans.length > 0) {
          setSelectedPlanId(localPlans[0].id || '');
        }
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [user]);

  // Execute real-time checkout updates
  const handleExecutePayment = async (booking: DBBooking) => {
    if (!booking.id) return;
    try {
      setLoadingBookings(true);
      await updateBookingStatus(booking.id, 'confirmed', 'paid');
      
      const updatedData = await getBookings(user.uid);
      const sorted = updatedData.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
      setBookings(sorted);
      
      setIsProcessingPayment(null);
      showNotification(`🎉 Checkout complete! ₦${(booking.totalAmount * 1.175).toLocaleString()} successfully processed via Firestore.`);
    } catch (err) {
      console.error("Payment error:", err);
      showNotification("Payment failed. Please verify connection and retry.");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Generate downloadable Invoice
  const downloadInvoiceText = (booking: DBBooking, vendorName: string) => {
    const invoiceContent = `
==================================================
              MYDAY BIRTHDAY STUDIO
                 INVOICE & RECEIPT
==================================================
Invoice ID: INV-${booking.id?.toUpperCase().slice(0, 8)}
Date Issued: ${new Date().toLocaleDateString()}
Due Date: ${new Date(booking.bookingDate).toLocaleDateString()}
Status: ${booking.paymentStatus.toUpperCase()}

CLIENT DETAILS:
Name: ${user.displayName || 'Guest'}
Email: ${user.email}

RESERVATION DETAILS:
Vendor: ${vendorName}
Booking Date: ${new Date(booking.bookingDate).toLocaleDateString()}
Booking Status: ${booking.bookingStatus.toUpperCase()}

CHARGES:
Base Cost: NGN ${booking.totalAmount.toLocaleString()}
Service Fee (10%): NGN ${(booking.totalAmount * 0.1).toLocaleString()}
Tax (7.5%): NGN ${(booking.totalAmount * 0.075).toLocaleString()}
--------------------------------------------------
TOTAL AMOUNT: NGN ${(booking.totalAmount * 1.175).toLocaleString()}
==================================================
          Thank you for choosing MyDay!
         Dynamic Birthday Magic Orchestration
==================================================
    `;
    
    const element = document.createElement("a");
    const file = new Blob([invoiceContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice_INV-${booking.id?.toUpperCase().slice(0, 8)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification("Invoice text file download started successfully!");
  };

  const renderPaymentsStats = () => {
    const totalBooked = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const paidAmount = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingAmount = bookings.filter(b => b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial').reduce((sum, b) => sum + b.totalAmount, 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-white/[0.04] bg-gradient-to-b from-[#151421] to-[#111019] rounded-[22px] shadow-lg">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#1C1A2D]/60 rounded-2xl flex items-center justify-center text-[#D6D3D1]">
              <Receipt className="w-5 h-5 text-[#D6D3D1]/80" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#A8A29E]">Total Booked Volume</p>
              <h4 className="text-xl sm:text-[22px] font-display font-semibold text-[#F5F5F4] mt-1">
                ₦{totalBooked.toLocaleString()}
              </h4>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-white/[0.04] bg-gradient-to-b from-[#151421] to-[#111019] rounded-[22px] shadow-lg">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5 text-emerald-400/80" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#A8A29E]">Paid & Settled</p>
              <h4 className="text-xl sm:text-[22px] font-display font-semibold text-emerald-400 mt-1">
                ₦{paidAmount.toLocaleString()}
              </h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-white/[0.04] bg-gradient-to-b from-[#151421] to-[#111019] rounded-[22px] shadow-lg">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5 text-amber-400/80" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#A8A29E]">Outstanding Balances</p>
              <h4 className="text-xl sm:text-[22px] font-display font-semibold text-amber-400 mt-1">
                ₦{pendingAmount.toLocaleString()}
              </h4>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderPaymentsList = (isLimit = false) => {
    if (loadingBookings) {
      return (
        <div className="flex flex-col items-center justify-center py-12 bg-[#12111A] rounded-[22px] border border-white/[0.04] space-y-3">
          <Loader2 className="w-7 h-7 text-[#6C4CF1] animate-spin" />
          <p className="text-xs text-[#A8A29E] font-normal">Loading reservation ledger from Firestore...</p>
        </div>
      );
    }

    const listToDisplay = isLimit ? bookings.slice(0, 3) : bookings;

    if (listToDisplay.length === 0) {
      return (
        <div className="text-center py-12 bg-[#12111A] rounded-[22px] border border-dashed border-white/[0.06] p-8 flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-[#1C1A2D]/60 rounded-2xl flex items-center justify-center border border-white/[0.04]">
            <CreditCard className="w-5 h-5 text-[#A8A29E]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-semibold text-base sm:text-lg text-[#F5F5F4]">No active bookings found</h4>
            <p className="text-sm text-[#D6D3D1] leading-relaxed max-w-sm mx-auto">
              You haven't initiated any boutique vendor requests. Once you request availability, reservation invoices will appear here in real-time.
            </p>
          </div>
          <Button
            onClick={onBrowseVendors}
            variant="outline"
            className="border-white/[0.08] hover:border-[#6C4CF1]/30 hover:text-[#B4A2FF] text-[#D6D3D1] text-xs px-5 py-2.5 rounded-xl transition-all duration-200"
          >
            Explore Bespoke Directory
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {listToDisplay.map((booking) => {
          const vendor = SAMPLE_VENDORS.find(v => v.id === booking.vendorId);
          const vendorName = vendor?.name || 'Boutique Service Partner';
          const vendorCategory = vendor?.category || 'Service';
          const vendorImage = vendor?.imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';

          return (
            <Card key={booking.id} className="border-white/[0.04] bg-[#12111A] hover:bg-[#151421] hover:border-[#6C4CF1]/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-[20px] overflow-hidden">
              <CardBody className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left Block: Image & Basic Info */}
                <div className="flex items-start sm:items-center space-x-5 flex-grow">
                  
                  {/* Vendor image - larger 72px */}
                  <div className="w-[72px] h-[72px] rounded-[16px] overflow-hidden bg-[#1C1A2D] border border-white/[0.06] shrink-0 shadow-inner relative group">
                    <img src={vendorImage} alt={vendorName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                  </div>
                  
                  {/* Info Column: Structured strictly as ordered */}
                  <div className="space-y-1.5 flex-grow">
                    {/* 1. Vendor Name */}
                    <h4 className="text-lg sm:text-xl font-display font-semibold text-[#F5F5F4] tracking-tight">{vendorName}</h4>
                    
                    {/* 2. Category badge & Code */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-0.5 bg-[#6C4CF1]/10 text-[#B4A2FF] border border-[#6C4CF1]/15 rounded-md">
                        {vendorCategory}
                      </span>
                      <span className="text-[10px] font-mono text-[#A8A29E]">
                        INV-{booking.id?.toUpperCase().slice(0, 8) || 'PENDING'}
                      </span>
                    </div>

                    {/* 3 & 4. Booking Date & Reservation Status Badge */}
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-[#D6D3D1] font-sans mt-1">
                      <span className="flex items-center font-normal">
                        <Calendar className="w-4 h-4 mr-1.5 text-[#A8A29E]/80 shrink-0" />
                        Date: <span className="font-semibold text-[#F5F5F4] ml-1">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                      </span>
                      <span className="text-white/[0.08] hidden sm:inline">•</span>
                      <span className="flex items-center font-normal">
                        Status: 
                        <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider ${
                          booking.bookingStatus === 'confirmed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                            : booking.bookingStatus === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border border-red-500/15'
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Block: Total, Payment Status Badge & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-5 md:pt-0 border-t md:border-t-0 border-white/[0.04] shrink-0">
                  {/* 5. Invoice Total */}
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-mono uppercase font-medium text-[#A8A29E] tracking-wider">Invoice Total</p>
                    <p className="text-xl sm:text-2xl font-display font-bold text-[#F5F5F4] mt-0.5">
                      ₦{booking.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  {/* 6 & 7. Payment Status & Actions container */}
                  <div className="flex items-center gap-3">
                    {/* 6. Payment Status - elegant green outline and soft bg for paid */}
                    {booking.paymentStatus === 'paid' ? (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/25 rounded-full text-xs font-medium shadow-sm shadow-emerald-500/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Paid</span>
                      </div>
                    ) : booking.paymentStatus === 'refunded' ? (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-500/5 text-red-400 border border-red-500/25 rounded-full text-xs font-medium shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span>Refunded</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/5 text-amber-400 border border-amber-500/25 rounded-full text-xs font-medium shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </div>
                    )}

                    {/* 7. Actions */}
                    <div className="flex items-center gap-2">
                      {/* Invoice details trigger */}
                      <button
                        onClick={() => setSelectedInvoice(booking)}
                        className="p-2.5 text-[#A8A29E] hover:text-[#B4A2FF] hover:bg-white/[0.04] rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-white/[0.04]"
                        title="View & Download Invoice"
                      >
                        <FileText className="w-4.5 h-4.5" />
                      </button>

                      {/* Pay Now trigger */}
                      {(booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partial') && (
                        <Button
                          onClick={() => setIsProcessingPayment(booking.id || null)}
                          className="bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] px-4.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderInvoiceModal = () => {
    if (!selectedInvoice) return null;
    const vendor = SAMPLE_VENDORS.find(v => v.id === selectedInvoice.vendorId);
    const vendorName = vendor?.name || 'Boutique Service Partner';
    const totalDue = selectedInvoice.totalAmount * 1.175;

    return (
      <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedInvoice(null)}
          className="absolute inset-0 bg-[#06050A]/85 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#12111A] text-[#F5F5F4] rounded-[24px] p-7 md:p-9 shadow-2xl space-y-6 z-10 border border-white/[0.04] font-sans max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={() => setSelectedInvoice(null)}
            className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#F5F5F4] transition-colors p-1.5 rounded-full hover:bg-white/[0.04] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-start border-b border-white/[0.04] pb-5">
            <div className="space-y-1">
              <h3 className="text-lg font-display font-semibold text-[#F5F5F4] tracking-tight flex items-center gap-1.5">
                <span>MyDay</span>
                <span className="text-[#B4A2FF] text-xs font-mono font-medium px-1.5 py-0.5 bg-[#6C4CF1]/10 rounded-md">STUDIO</span>
              </h3>
              <p className="text-[10px] text-[#A8A29E] font-medium tracking-wide uppercase font-mono">Bespoke Event Invoicing</p>
            </div>
            
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase ${
                selectedInvoice.paymentStatus === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
              }`}>
                {selectedInvoice.paymentStatus.toUpperCase()}
              </span>
              <p className="text-[10px] font-mono text-[#A8A29E] mt-1.5">INV-{selectedInvoice.id?.toUpperCase().slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase font-semibold text-[#A8A29E]">Invoiced To:</p>
              <p className="font-semibold text-[#F5F5F4] mt-1">{user.displayName || 'Bespoke Client'}</p>
              <p className="text-[#D6D3D1] font-normal">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase font-semibold text-[#A8A29E]">Payment Due:</p>
              <p className="font-semibold text-[#F5F5F4] mt-1">{new Date(selectedInvoice.bookingDate).toLocaleDateString()}</p>
              <p className="text-[#D6D3D1] font-normal">Status: {selectedInvoice.bookingStatus}</p>
            </div>
          </div>

          <div className="border-t border-b border-white/[0.04] py-4 space-y-3 text-xs">
            <p className="text-[10px] font-mono uppercase font-semibold text-[#A8A29E]">Ledger Details</p>
            <div className="flex justify-between text-[#D6D3D1]">
              <span>{vendorName} Reservation Base Cost</span>
              <span className="font-mono font-medium text-[#F5F5F4]">₦{selectedInvoice.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#D6D3D1] font-light">
              <span>Studio Coordination Fee (10%)</span>
              <span className="font-mono text-[#F5F5F4]">₦{(selectedInvoice.totalAmount * 0.1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#D6D3D1] font-light">
              <span>Value-Added Tax (7.5%)</span>
              <span className="font-mono text-[#F5F5F4]">₦{(selectedInvoice.totalAmount * 0.075).toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/[0.04]" />
            <div className="flex justify-between font-semibold text-[#F5F5F4] text-sm">
              <span>Total Amount Due</span>
              <span className="font-mono text-[#B4A2FF]">₦{totalDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <Button
              onClick={() => downloadInvoiceText(selectedInvoice, vendorName)}
              variant="primary"
              className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 py-3 text-xs uppercase font-medium tracking-wider rounded-xl flex items-center justify-center space-x-2 text-[#F5F5F4] shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </Button>
            <Button
              onClick={() => setSelectedInvoice(null)}
              variant="secondary"
              className="border-white/[0.04] bg-white/[0.03] hover:bg-white/[0.06] text-[#D6D3D1] hover:text-[#F5F5F4] py-3 text-xs uppercase font-medium tracking-wider rounded-xl transition-all"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCheckoutModal = () => {
    if (!isProcessingPayment) return null;
    const booking = bookings.find(b => b.id === isProcessingPayment);
    if (!booking) return null;
    const vendor = SAMPLE_VENDORS.find(v => v.id === booking.vendorId);
    const vendorName = vendor?.name || 'Boutique Service Partner';
    const totalDue = booking.totalAmount * 1.175;

    return (
      <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsProcessingPayment(null)}
          className="absolute inset-0 bg-[#06050A]/85 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#12111A] text-[#F5F5F4] rounded-[24px] p-7 shadow-2xl space-y-6 z-10 border border-white/[0.04] font-sans max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={() => setIsProcessingPayment(null)}
            className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#F5F5F4] transition-colors p-1.5 rounded-full hover:bg-white/[0.04] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-[#6C4CF1]/10 rounded-2xl flex items-center justify-center text-[#B4A2FF] mb-2">
              <CreditCard className="w-5 h-5 text-[#B4A2FF]" />
            </div>
            <h3 className="text-xl font-display font-semibold text-[#F5F5F4] tracking-tight">
              Boutique Checkout Portal
            </h3>
            <p className="text-xs text-[#D6D3D1] font-normal">
              Securely finalize reservation for <strong className="text-[#F5F5F4] font-medium">{vendorName}</strong>.
            </p>
          </div>

          <div className="bg-[#171624] p-4.5 rounded-xl border border-white/[0.04] space-y-2.5 text-xs">
            <div className="flex justify-between text-[#D6D3D1] font-normal">
              <span>Reservation Ref:</span>
              <span className="font-mono text-[#F5F5F4]">INV-{booking.id?.toUpperCase().slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-[#D6D3D1] font-normal">
              <span>Booking Date:</span>
              <span className="text-[#F5F5F4]">{new Date(booking.bookingDate).toLocaleDateString()}</span>
            </div>
            <div className="h-px bg-white/[0.04] my-1" />
            <div className="flex justify-between font-semibold text-[#F5F5F4]">
              <span>Amount Due (incl. Tax & Fees):</span>
              <span className="font-mono text-[#B4A2FF]">₦{totalDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A8A29E] block">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#6C4CF1]/50 bg-[#6C4CF1]/10 p-3 rounded-xl flex items-center space-x-2.5 cursor-pointer">
                <CheckCircle className="w-4 h-4 text-[#B4A2FF] fill-[#6C4CF1]/10" />
                <span className="text-xs font-semibold text-[#F5F5F4]">MyDay Balance</span>
              </div>
              <div className="border border-white/[0.04] hover:border-[#6C4CF1]/20 bg-transparent p-3 rounded-xl flex items-center space-x-2.5 cursor-pointer opacity-50" onClick={() => showNotification("Card processor disabled in sandbox mode. Please use local Balance.")}>
                <div className="w-4 h-4 rounded-full border border-white/[0.1] shrink-0" />
                <span className="text-xs font-semibold text-[#A8A29E]">Credit Card</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <Button
              onClick={() => handleExecutePayment(booking)}
              disabled={loadingBookings}
              variant="primary"
              className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 border-none py-3 text-xs uppercase font-medium tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-md transition-colors text-[#F5F5F4] hover:-translate-y-0.5"
            >
              {loadingBookings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Confirm & Pay ₦{totalDue.toLocaleString()}</span>
            </Button>
            <Button
              onClick={() => setIsProcessingPayment(null)}
              variant="secondary"
              className="border-white/[0.04] bg-white/[0.03] hover:bg-white/[0.06] text-[#D6D3D1] hover:text-[#F5F5F4] py-3 text-xs uppercase font-medium tracking-wider rounded-xl transition-all"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Dynamic Time-of-Day Greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mock Notifications
  const notifications = [
    { id: 1, text: "✨ AI curated 3 new themes for Sarah's party!", time: "5m ago", unread: true },
    { id: 2, text: "🎉 Reminder: Jordan's birthday is in 5 days.", time: "2h ago", unread: true },
    { id: 3, text: "🎈 Vendor 'Bubble Pop Balloons' added new catalog items.", time: "1d ago", unread: false }
  ];

  // Placeholder AI Ideas
  const aiThemes = [
    { title: "Retro Neon Arcade Bash", ageGroup: "20s-30s", vibe: "High-energy, nostalgic", desc: "Equipped with vintage cabinets, pixelated decor, and neon glow cups." },
    { title: "Pastel Enchanted Woodland", ageGroup: "Kids (4-8)", vibe: "Whimsical, soft", desc: "Fairy wing party favors, tree-trunk cupcakes, and dynamic floral backdrops." },
    { title: "Midnight Stargazer Observatory", ageGroup: "Teens & Adults", vibe: "Mystical, premium", desc: "Telescope setups, constellation cupcakes, and dark indigo velvet lounge spaces." }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showNotification(`Searching workspace for "${searchQuery}"...`);
    setSearchQuery('');
  };

  const normalizeCategory = (cat: string) => {
    const c = cat ? cat.toLowerCase() : 'other';
    if (c.includes('venue') || c.includes('hall')) return 'Venue & Space';
    if (c.includes('catering') || c.includes('restaurant') || c.includes('food')) return 'Gourmet Catering';
    if (c.includes('decor')) return 'Aesthetic Decor';
    if (c.includes('entertainment') || c.includes('music') || c.includes('dj')) return 'Premium Entertainment';
    if (c.includes('baking') || c.includes('cake') || c.includes('patisserie')) return 'Atelier Cakes';
    if (c.includes('photo') || c.includes('camera')) return 'Photography';
    if (c.includes('gift') || c.includes('shop')) return 'Gifts & Favors';
    return 'Other Expenses';
  };

  const getBudgetBreakdown = (plan: BirthdayPlan | null, bookingsList: DBBooking[]) => {
    if (!plan) return [];
    
    // Find bookings related to this user and categorize
    const planBookings = bookingsList;
    const budgetVal = plan.budget; // in NGN
    
    const bookedByCategory: { [key: string]: number } = {};
    planBookings.forEach(b => {
      const vendor = SAMPLE_VENDORS.find(v => v.id === b.vendorId);
      const categoryName = normalizeCategory(vendor?.category || 'other');
      const amountNGN = b.totalAmount; // natively in NGN
      bookedByCategory[categoryName] = (bookedByCategory[categoryName] || 0) + amountNGN;
    });

    const categories = [
      { name: 'Venue & Space', defaultPercent: 30, color: '#6C4CF1' },
      { name: 'Gourmet Catering', defaultPercent: 25, color: '#10B981' },
      { name: 'Aesthetic Decor', defaultPercent: 15, color: '#F59E0B' },
      { name: 'Premium Entertainment', defaultPercent: 15, color: '#EC4899' },
      { name: 'Atelier Cakes', defaultPercent: 10, color: '#3B82F6' },
      { name: 'Photography', defaultPercent: 5, color: '#8B5CF6' }
    ];

    const chartData = categories.map(cat => {
      const bookedAmount = bookedByCategory[cat.name] || 0;
      const plannedAmount = Math.round(budgetVal * (cat.defaultPercent / 100));
      const expenseAmount = bookedAmount > 0 ? bookedAmount : plannedAmount;
      const isBooked = bookedAmount > 0;
      
      return {
        name: cat.name,
        value: expenseAmount,
        color: cat.color,
        isBooked,
        bookedAmount,
        plannedAmount,
        percentage: Math.round((expenseAmount / budgetVal) * 100)
      };
    });

    const totalExpenses = chartData.reduce((sum, d) => sum + d.value, 0);
    const remainingBudget = Math.max(0, budgetVal - totalExpenses);

    if (remainingBudget > 0) {
      chartData.push({
        name: 'Unallocated Balance',
        value: remainingBudget,
        color: '#322B54',
        isBooked: false,
        bookedAmount: 0,
        plannedAmount: remainingBudget,
        percentage: Math.round((remainingBudget / budgetVal) * 100)
      });
    }

    return chartData;
  };

  // Fully route payments layout when forceShowPayments is activated
  if (forceShowPayments) {
    return (
      <div id="premium-payments-container" className="max-w-7xl mx-auto px-6 sm:px-8 md:px-10 py-8 sm:py-12 space-y-12 sm:space-y-16 text-[#F5F5F4] bg-[#09080F] rounded-[32px] border border-white/[0.04] p-8 sm:p-10 md:p-12 shadow-[0_32px_96px_rgba(0,0,0,0.8)] relative overflow-hidden font-sans">
        {/* Payments Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.04] pb-8">
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center text-xs font-semibold text-[#A692FF] hover:text-[#B4A2FF] mb-1.5 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#F5F5F4] tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-[#6C4CF1] opacity-90" />
              <span>Payments & Invoices</span>
            </h2>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal max-w-2xl">
              Track active boutique reservations, settle outstanding invoices in real-time, and download professional records.
            </p>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            <Button
              onClick={onBrowseVendors}
              variant="primary"
              className="bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center space-x-2 shadow-md transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Vendor</span>
            </Button>
          </div>
        </div>

        {/* Real-time stats panel */}
        {renderPaymentsStats()}

        {/* Payments List */}
        {renderPaymentsList()}

        {/* Invoice Modal */}
        <AnimatePresence>
          {selectedInvoice && renderInvoiceModal()}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {isProcessingPayment && renderCheckoutModal()}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div id="premium-dashboard-container" className="max-w-7xl mx-auto px-6 sm:px-8 md:px-10 py-8 sm:py-12 space-y-12 sm:space-y-16 lg:space-y-20 text-[#F5F5F4] bg-[#09080F] rounded-[32px] border border-white/[0.04] p-8 sm:p-10 md:p-12 shadow-[0_32px_96px_rgba(0,0,0,0.8)] relative overflow-hidden font-sans">
      
      {/* 1. Hero Welcome Segment */}
      <div 
        id="dashboard-hero-banner"
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0E0D16] via-[#131124] to-[#0A0910] border border-white/[0.04] p-8 sm:p-12 md:p-16 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12"
      >
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C4CF1]/8 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F4B400]/4 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        
        {/* Soft Premium Purple & Gold Gradient Glow directly behind content */}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-gradient-to-tr from-[#6C4CF1]/10 to-[#F4B400]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="space-y-5 sm:space-y-6 z-10 max-w-2xl relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-[#6C4CF1]/10 border border-[#6C4CF1]/15 text-[#B4A2FF] rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-[#F4B400]/90 animate-spin" />
            <span>Premium Studio Membership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-display font-bold text-[#F5F5F4] tracking-tight leading-[1.15]">
            {getGreeting()}, {user.displayName || 'Guest'} 👋
          </h2>
          <p className="text-sm sm:text-base md:text-[17px] text-[#D6D3D1] font-normal leading-relaxed">
            Ready to create another unforgettable celebration? Design timelines, match premium vendors, and customize experiences.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto z-10 shrink-0 relative">
          <Button
            id="hero-plan-birthday-btn"
            onClick={onPlanBirthday}
            variant="primary"
            className="w-full sm:w-auto justify-center bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(108,76,241,0.3)] shadow-[0_4px_12px_rgba(108,76,241,0.15)] flex items-center space-x-2 border border-white/[0.08]"
          >
            <Cake className="w-5 h-5 text-[#F4B400]/95" />
            <span>Plan a Birthday</span>
          </Button>
          <Button
            id="hero-browse-vendors-btn"
            onClick={onBrowseVendors}
            variant="secondary"
            className="w-full sm:w-auto justify-center border border-white/[0.08] hover:border-[#6C4CF1]/30 bg-white/[0.03] hover:bg-white/[0.06] text-[#D6D3D1] hover:text-[#F5F5F4] px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex items-center"
          >
            Browse Vendors
          </Button>
        </div>
      </div>

      {/* 2. Core Dashboard Cards Grid */}
      <div id="core-cards-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Saved Plans */}
        <Card 
          id="saved-plans-card"
          className="border-white/[0.04] hover:border-[#6C4CF1]/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group bg-gradient-to-b from-[#151421] to-[#111019] h-full rounded-[22px]"
          onClick={() => onNavigateTab('planner')}
        >
          <CardBody className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="w-11 h-11 bg-[#6C4CF1]/10 rounded-xl flex items-center justify-center text-[#B4A2FF] transition-all duration-300 group-hover:scale-105 mb-4">
                <Calendar className="w-5 h-5 text-[#B4A2FF]/90" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[18px] sm:text-[19px] text-[#F5F5F4] flex items-center justify-between">
                  <span>Saved Plans</span>
                  <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#B4A2FF] group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-[#D6D3D1] font-normal leading-relaxed mt-2">
                  View and manage your saved birthday plans.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Upcoming Celebrations */}
        <Card 
          id="upcoming-celebrations-card"
          className="border-white/[0.04] hover:border-[#6C4CF1]/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group bg-gradient-to-b from-[#151421] to-[#111019] h-full rounded-[22px]"
          onClick={() => onNavigateTab('planner')}
        >
          <CardBody className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="w-11 h-11 bg-[#F4B400]/10 rounded-xl flex items-center justify-center text-[#F4B400] transition-all duration-300 group-hover:scale-105 mb-4">
                <Clock className="w-5 h-5 text-[#F4B400]/90" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[18px] sm:text-[19px] text-[#F5F5F4] flex items-center justify-between">
                  <span>Upcoming Celebrations</span>
                  <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#B4A2FF] group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-[#D6D3D1] font-normal leading-relaxed mt-2">
                  See birthdays you've planned and upcoming reminders.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Favorite Vendors */}
        <Card 
          id="favorite-vendors-card"
          className="border-white/[0.04] hover:border-[#6C4CF1]/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group bg-gradient-to-b from-[#151421] to-[#111019] h-full rounded-[22px]"
          onClick={() => onNavigateTab('vendors')}
        >
          <CardBody className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="w-11 h-11 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 transition-all duration-300 group-hover:scale-105 mb-4">
                <Heart className="w-5 h-5 fill-rose-500/5 text-rose-400/90" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[18px] sm:text-[19px] text-[#F5F5F4] flex items-center justify-between">
                  <span>Favorite Vendors</span>
                  <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#B4A2FF] group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-[#D6D3D1] font-normal leading-relaxed mt-2">
                  Quick access to your trusted vendors.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 4: AI Suggestions */}
        <Card 
          id="ai-suggestions-card"
          className="border-white/[0.04] hover:border-[#6C4CF1]/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group bg-gradient-to-b from-[#151421] to-[#111019] relative overflow-hidden h-full rounded-[22px]"
          onClick={() => setActiveSuggestionModal(true)}
        >
          {/* subtle gold corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F4B400]/5 rounded-full blur-md"></div>
          <CardBody className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 transition-all duration-300 group-hover:scale-105 mb-4">
                <Wand2 className="w-5 h-5 text-amber-400/90" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[18px] sm:text-[19px] text-[#F5F5F4] flex items-center justify-between">
                  <span>AI Suggestions</span>
                  <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#B4A2FF] group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs sm:text-sm text-[#D6D3D1] font-normal leading-relaxed mt-2">
                  Personalized birthday ideas generated by AI.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

      </div>

      {/* Dynamic Budget & Expense Analytics Section with Recharts Donut Chart */}
      <div id="budget-analytics-section" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl md:text-[30px] font-display font-bold text-[#F5F5F4] tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-[#6C4CF1] opacity-90" />
              <span>Budget & Expense Orchestration</span>
            </h3>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">
              Visualize your planned category allocations against actual reservation ledger items in real-time.
            </p>
          </div>
          
          {/* Plan selector if multiple plans exist */}
          {plans.length > 0 && (
            <div className="flex items-center space-x-2 bg-[#151421] border border-white/[0.04] p-1.5 rounded-xl self-start sm:self-auto shadow-sm">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#A8A29E] pl-2">Select Plan:</span>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="bg-[#12111A] text-xs text-[#F5F5F4] font-medium outline-none cursor-pointer px-3 py-1.5 rounded-lg border border-white/[0.06] focus:border-[#6C4CF1]/40 font-sans"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#12111A] text-[#F5F5F4]">
                    {p.celebrantName}'s {p.age}th • {p.themeTitle || 'Theme Plan'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {plans.length === 0 ? (
          <Card className="border-white/[0.04] p-8 sm:p-12 text-center bg-[#12111A] rounded-[22px]">
            <CardBody className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#6C4CF1]/10 rounded-full flex items-center justify-center text-[#B4A2FF]">
                <DollarSign className="w-8 h-8" />
              </div>
              <h4 className="font-display font-semibold text-[18px] sm:text-[20px] text-[#F5F5F4]">No active budget model found</h4>
              <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">
                Once you generate or custom-model an AI birthday plan, your interactive budget allocation and ledger breakdowns will auto-render here.
              </p>
              <Button onClick={onPlanBirthday} variant="primary" className="bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 font-semibold text-xs uppercase tracking-wider rounded-xl">
                Design Your Plan
              </Button>
            </CardBody>
          </Card>
        ) : (
          (() => {
            const plan = plans.find(p => p.id === selectedPlanId) || plans[0];
            const chartData = getBudgetBreakdown(plan, bookings);
            const totalNGN = plan.budget;
            const totalSpentNGN = chartData.filter(d => d.name !== 'Unallocated Balance' && d.isBooked).reduce((sum, d) => sum + d.bookedAmount, 0);
            const totalPlannedNGN = chartData.filter(d => d.name !== 'Unallocated Balance').reduce((sum, d) => sum + d.value, 0);
            
            return (
              <Card className="border-white/[0.04] overflow-hidden bg-[#12111A] rounded-[24px] shadow-lg">
                <CardBody className="p-8 sm:p-10 lg:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Left/Center Column: Recharts Donut Chart */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative bg-[#171624] p-6 rounded-[22px] border border-white/[0.04]">
                      <div className="w-full h-[260px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any, name: any, props: any) => {
                                const payload = props.payload;
                                if (name === 'Unallocated Balance') {
                                  return [`₦${value.toLocaleString()}`, 'Unallocated'];
                                }
                                return [
                                  `₦${value.toLocaleString()} (${payload.percentage}%)`, 
                                  payload.isBooked ? `${name} (Booked)` : `${name} (Estimated)`
                                ];
                              }}
                              contentStyle={{ 
                                backgroundColor: '#12111A', 
                                border: '1px solid rgba(255, 255, 255, 0.08)', 
                                borderRadius: '12px',
                                color: '#F5F5F4',
                                fontSize: '12px',
                                padding: '10px 14px',
                                fontFamily: 'Inter, sans-serif'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Inside Donut Text Center */}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-mono font-medium text-[#A8A29E] uppercase tracking-widest">Total Budget</span>
                          <span className="text-2xl sm:text-[28px] font-display font-semibold text-[#F5F5F4] leading-tight">
                            ₦{totalNGN.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-[#B4A2FF] mt-0.5">
                            NGN
                          </span>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 gap-4 w-full border-t border-white/[0.06] pt-5 mt-3 text-center">
                        <div>
                          <p className="text-[10px] font-mono font-medium text-[#A8A29E] uppercase tracking-wider">Booked Services</p>
                          <p className="text-sm sm:text-base font-semibold text-emerald-400 font-mono mt-0.5">₦{totalSpentNGN.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono font-medium text-[#A8A29E] uppercase tracking-wider">Estimated Remaining</p>
                          <p className="text-sm sm:text-base font-semibold text-[#B4A2FF] font-mono mt-0.5">₦{Math.max(0, totalPlannedNGN - totalSpentNGN).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Detailed Breakdown Ledger */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                        <h4 className="font-display font-semibold text-base sm:text-lg text-[#F5F5F4]">Bespoke Expense Breakdown</h4>
                        <span className="text-[10px] font-mono font-medium bg-[#6C4CF1]/10 text-[#B4A2FF] px-2.5 py-1 rounded-md border border-white/[0.04]">
                          Base Currency: NGN (₦)
                        </span>
                      </div>

                      <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((item, idx) => {
                          if (item.name === 'Unallocated Balance') {
                            return (
                              <div key={idx} className="flex items-center justify-between p-4 bg-[#12111A]/80 rounded-xl border border-dashed border-white/[0.04]">
                                <div className="flex items-center space-x-3">
                                  <div className="w-3 h-3 rounded-full bg-[#322B54] border border-white/[0.04]" />
                                  <span className="text-sm font-medium text-[#D6D3D1]">Unallocated Reserve</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-[#F5F5F4] font-mono">₦{item.value.toLocaleString()}</span>
                                  <span className="text-[10px] font-mono font-medium text-[#A8A29E] block mt-0.5">{item.percentage}% of total</span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:bg-white/[0.01] ${
                                item.isBooked 
                                  ? 'border-emerald-500/15 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]' 
                                  : 'border-white/[0.04] bg-[#0A0910]/80 hover:bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm sm:text-base font-semibold text-[#F5F5F4]">{item.name}</span>
                                    {item.isBooked && (
                                      <span className="inline-flex items-center text-[9px] font-mono font-medium uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                                        Booked
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-[#A8A29E] font-normal font-sans mt-0.5 block">
                                    {item.isBooked 
                                      ? `Actual reservation: ₦${item.bookedAmount.toLocaleString()}` 
                                      : `Target budget threshold limit`
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm sm:text-base font-semibold text-[#F5F5F4] font-mono">
                                  ₦{item.value.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-mono font-medium text-[#A8A29E] block mt-0.5">
                                  {item.percentage}% of budget
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Exceedance alert warning banner */}
                      {totalPlannedNGN > totalNGN && (
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-red-200 flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-semibold text-[#F5F5F4]">Planned Category Expenses Exceed Budget</h5>
                            <p className="text-xs text-[#D6D3D1] font-sans mt-1 leading-relaxed">
                              Your current selections or allocations total <strong className="text-white">₦{totalPlannedNGN.toLocaleString()}</strong>, which is over your target of <strong className="text-white">₦{totalNGN.toLocaleString()}</strong>. Consider adjusting parameters in the Celebrations Studio.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </CardBody>
              </Card>
            );
          })()
        )}
      </div>

      {/* 3. Quick Actions Grid */}
      <div id="quick-actions-section" className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl md:text-[30px] font-display font-bold text-[#F5F5F4] tracking-tight">Quick Actions</h3>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">Direct pathways to design components of your perfect day.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          
          {/* Action 1: Plan Birthday */}
          <button
            id="qa-plan-birthday"
            onClick={onPlanBirthday}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#6C4CF1]/10 rounded-xl flex items-center justify-center text-[#B4A2FF] mb-3 group-hover:scale-105 transition-transform">
              <Cake className="w-5 h-5 text-[#B4A2FF]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Plan Birthday
            </span>
          </button>

          {/* Action 2: Gift Ideas */}
          <button
            id="qa-gift-ideas"
            onClick={() => setActiveQuickActionModal({
              title: "AI Gift Planner",
              desc: "Get tailored gift list proposals mapped dynamically to your budget, celebrant demographics, and interest graph tags.",
              icon: <Gift className="w-8 h-8 text-[#F4B400]" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Gift Ideas
            </span>
          </button>

          {/* Action 3: Decorations */}
          <button
            id="qa-decorations"
            onClick={() => setActiveQuickActionModal({
              title: "Theme Decor Catalogs",
              desc: "Explore stunning balloon arches, backdrops, custom dinnerware sets, and dynamic color palettes designed by pro planners.",
              icon: <Sparkles className="w-8 h-8 text-[#6C4CF1]" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#6C4CF1]/10 rounded-xl flex items-center justify-center text-[#B4A2FF] mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Decorations
            </span>
          </button>

          {/* Action 4: Photography */}
          <button
            id="qa-photography"
            onClick={() => setActiveQuickActionModal({
              title: "Photography Matcher",
              desc: "Instantly match with top local event photographers, photo booth agencies, and videographers matching your date.",
              icon: <Camera className="w-8 h-8 text-sky-400" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Photography
            </span>
          </button>

          {/* Action 5: Restaurants */}
          <button
            id="qa-restaurants"
            onClick={() => setActiveQuickActionModal({
              title: "Premium Caterers & Venues",
              desc: "Discover unique dining experiences, food trucks, mixologist bars, and gourmet sit-down menus tailored for celebrations.",
              icon: <Utensils className="w-8 h-8 text-emerald-400" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Restaurants
            </span>
          </button>

          {/* Action 6: Entertainment */}
          <button
            id="qa-entertainment"
            onClick={() => setActiveQuickActionModal({
              title: "Entertainment & Live Events",
              desc: "From professional DJs and saxophonists to magical illusionists and custom trivia hosts, find the heartbeat of your party.",
              icon: <Music className="w-8 h-8 text-indigo-400" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-[#12111A] border border-white/[0.04] hover:border-[#6C4CF1]/30 rounded-[18px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6D3D1] group-hover:text-[#F5F5F4] transition-colors font-sans mt-1">
              Entertainment
            </span>
          </button>

        </div>
      </div>

      {/* Real-time Payments Overview Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl md:text-[30px] font-display font-bold text-[#F5F5F4] tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-[#6C4CF1] shrink-0 opacity-90" />
              <span>Real-time Bookings & Payments</span>
            </h3>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">
              Active vendor reservations and digital invoices linked directly to your Firestore database.
            </p>
          </div>
          <button 
            onClick={() => onNavigateTab('payments')}
            className="text-xs sm:text-sm font-semibold text-[#A692FF] hover:text-[#B4A2FF] transition-colors flex items-center self-start sm:self-center shrink-0 uppercase tracking-wider"
          >
            <span>View All Payments</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {renderPaymentsList(true)}
      </div>

      {/* 4. Secondary Information (Recent Activity & Profile Snapshot) */}
      <div id="activity-profile-split" className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left 2 Cols: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl md:text-[30px] font-display font-bold text-[#F5F5F4] tracking-tight">Activity Stream</h3>
              <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">
                {activityTab === 'recent' 
                  ? "Keep track of the details you've finalized recently." 
                  : "Track booking milestones and secure your event timeline."}
              </p>
            </div>
            
            {/* Elegant Tab Switcher */}
            <div className="flex p-1 bg-[#151421] border border-white/[0.04] rounded-xl self-start sm:self-center shrink-0 shadow-sm">
              <button
                onClick={() => setActivityTab('recent')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  activityTab === 'recent' 
                    ? 'bg-[#6C4CF1] text-[#F5F5F4] shadow-md' 
                    : 'text-[#A8A29E] hover:text-[#F5F5F4]'
                }`}
              >
                Recent History
              </button>
              <button
                onClick={() => setActivityTab('upcoming')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  activityTab === 'upcoming' 
                    ? 'bg-[#6C4CF1] text-[#F5F5F4] shadow-md' 
                    : 'text-[#A8A29E] hover:text-[#F5F5F4]'
                }`}
              >
                <span>Upcoming Timeline</span>
                <span className="bg-white/10 text-[#F5F5F4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">4</span>
              </button>
            </div>
          </div>

          <Card id="recent-activity-card" className="border-white/[0.04] shadow-lg bg-[#12111A] rounded-[22px]">
            <CardBody className="p-0">
              <AnimatePresence mode="wait">
                {activityTab === 'recent' ? (
                  <motion.div
                    key="recent-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8 relative bg-transparent rounded-[22px]"
                  >
                    {/* Vertical timeline track line */}
                    <div className="absolute left-[39px] sm:left-[43px] top-12 bottom-12 w-0.5 border-l-2 border-dashed border-[#6C4CF1]/15 pointer-events-none" />

                    <div className="space-y-6">
                      
                      {/* Activity 1: Birthday Plan Created */}
                      <div className="flex items-start gap-4 sm:gap-6 group relative">
                        {/* Connected Icon */}
                        <div className="relative z-10 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/30">
                            <Cake className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#12111A]" />
                        </div>

                        {/* Card Content with beautiful hover animation */}
                        <div className="flex-grow space-y-2 bg-[#100F17]/80 hover:bg-[#151421] rounded-[18px] p-5 border border-white/[0.04] hover:border-[#6C4CF1]/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-sans">
                            <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#F5F5F4] group-hover:text-[#B4A2FF] transition-colors leading-snug">
                              ✓ Birthday Plan Created
                            </h4>
                            <span className="text-xs font-mono font-medium text-[#A8A29E] shrink-0">12m ago</span>
                          </div>
                          <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                            Successfully designed a whimsical pastel balloon setup and vintage game lounge for Jordan's 6th party.
                          </p>
                        </div>
                      </div>

                      {/* Activity 2: Vendor Saved */}
                      <div className="flex items-start gap-4 sm:gap-6 group relative">
                        {/* Connected Icon */}
                        <div className="relative z-10 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center text-rose-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-rose-500/30">
                            <Bookmark className="w-5 h-5 text-rose-400" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-400 border-2 border-[#12111A]" />
                        </div>

                        {/* Card Content with beautiful hover animation */}
                        <div className="flex-grow space-y-2 bg-[#100F17]/80 hover:bg-[#151421] rounded-[18px] p-5 border border-white/[0.04] hover:border-[#6C4CF1]/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-sans">
                            <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#F5F5F4] group-hover:text-[#B4A2FF] transition-colors leading-snug">
                              ✓ Vendor Saved
                            </h4>
                            <span className="text-xs font-mono font-medium text-[#A8A29E] shrink-0">2h ago</span>
                          </div>
                          <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                            Added 'Sugar&Spice Patisserie' to your favorites list for artisanal dessert catering.
                          </p>
                        </div>
                      </div>

                      {/* Activity 3: Booking Confirmed */}
                      <div className="flex items-start gap-4 sm:gap-6 group relative">
                        {/* Connected Icon */}
                        <div className="relative z-10 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center text-sky-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/30">
                            <CheckCircle className="w-5 h-5 text-sky-400" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sky-400 border-2 border-[#12111A]" />
                        </div>

                        {/* Card Content with beautiful hover animation */}
                        <div className="flex-grow space-y-2 bg-[#100F17]/80 hover:bg-[#151421] rounded-[18px] p-5 border border-white/[0.04] hover:border-[#6C4CF1]/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-sans">
                            <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#F5F5F4] group-hover:text-[#B4A2FF] transition-colors leading-snug">
                              ✓ Booking Confirmed
                            </h4>
                            <span className="text-xs font-mono font-medium text-[#A8A29E] shrink-0">1d ago</span>
                          </div>
                          <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                            Boutique photo studio reservation finalized and secured for Jordan's upcoming milestone.
                          </p>
                        </div>
                      </div>

                      {/* Activity 4: Celebration Completed */}
                      <div className="flex items-start gap-4 sm:gap-6 group relative">
                        {/* Connected Icon */}
                        <div className="relative z-10 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-amber-500/30">
                            <PartyPopper className="w-5 h-5 text-amber-400" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#12111A]" />
                        </div>

                        {/* Card Content with beautiful hover animation */}
                        <div className="flex-grow space-y-2 bg-[#100F17]/80 hover:bg-[#151421] rounded-[18px] p-5 border border-white/[0.04] hover:border-[#6C4CF1]/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-sans">
                            <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#F5F5F4] group-hover:text-[#B4A2FF] transition-colors leading-snug">
                              ✓ Celebration Completed
                            </h4>
                            <span className="text-xs font-mono font-medium text-[#A8A29E] shrink-0">2d ago</span>
                          </div>
                          <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                            The Neon Glow arcade celebration was hosted successfully. Rate your experience!
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* View Full Activity Button */}
                    <div className="mt-8 flex justify-center border-t border-white/[0.04] pt-6">
                      <Button
                        onClick={() => {
                          showNotification("Opening complete activity logs...");
                        }}
                        variant="outline"
                        className="w-full sm:w-auto border-white/[0.06] hover:border-[#6C4CF1]/30 hover:text-[#B4A2FF] text-[#D6D3D1] text-xs px-6 py-3 rounded-xl transition-all duration-250 hover:-translate-y-0.5 font-semibold uppercase tracking-wider shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <span>View Full Activity</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                  </motion.div>
                ) : (
                  <motion.div
                    key="upcoming-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8 relative bg-transparent rounded-[22px]"
                  >
                    {/* Vertical timeline track line */}
                    <div className="absolute left-[43px] top-12 bottom-12 w-0.5 border-l-2 border-dashed border-[#6C4CF1]/15 pointer-events-none"></div>

                    <div className="space-y-6">
                      {upcomingActivitiesList.map((activity) => {
                        const isExpanded = expandedActivityId === activity.id;
                        
                        // Icon mapping
                        let IconComponent = Clock;
                        let statusColor = 'bg-[#A8A29E]';
                        let statusText = 'Scheduled';
                        let statusBadgeClass = 'bg-[#151421] text-[#A8A29E] border-white/[0.04]';
                        
                        if (activity.type === 'ai') {
                          IconComponent = Wand2;
                        } else if (activity.type === 'booking') {
                          IconComponent = CheckCircle;
                        } else if (activity.type === 'catering') {
                          IconComponent = Utensils;
                        } else if (activity.type === 'entertainment') {
                          IconComponent = Music;
                        }

                        if (activity.status === 'completed') {
                          statusColor = 'bg-emerald-500';
                          statusText = 'Verified';
                          statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
                        } else if (activity.status === 'action_required') {
                          statusColor = 'bg-amber-500';
                          statusText = 'Action Needed';
                          statusBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/15';
                        } else if (activity.status === 'scheduled') {
                          statusColor = 'bg-[#6C4CF1]';
                          statusText = 'Confirmed';
                          statusBadgeClass = 'bg-[#6C4CF1]/10 text-[#B4A2FF] border border-[#6C4CF1]/15';
                        }

                        return (
                          <div 
                            key={activity.id} 
                            className="relative flex gap-5 sm:gap-6 items-start group"
                          >
                            {/* Left timeline badge/indicator */}
                            <div className="relative z-10 shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-[#0B0A10] border border-white/[0.06] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-[#6C4CF1]/30 shadow-sm">
                                <IconComponent className={`w-5 h-5 ${isExpanded ? 'text-[#B4A2FF]' : 'text-[#D6D3D1]'}`} />
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColor} border-2 border-[#12111A]`} />
                            </div>

                            {/* Right content box */}
                            <div className="flex-grow space-y-2 bg-[#100F17]/80 hover:bg-[#151421] rounded-[18px] p-4.5 sm:p-5 border border-white/[0.04] hover:border-[#6C4CF1]/20 shadow-sm transition-all duration-300">
                              {/* Header triggers expansion */}
                              <button
                                onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                                className="w-full flex items-start justify-between text-left gap-3 focus:outline-none cursor-pointer"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#F5F5F4] group-hover:text-[#B4A2FF] transition-colors leading-snug">
                                      {activity.title}
                                    </h4>
                                    <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusBadgeClass}`}>
                                      {statusText}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#A8A29E] font-medium font-mono">
                                    {activity.subtitle}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[#A8A29E] shrink-0">
                                  <span className="text-xs font-mono font-semibold hidden sm:inline-block">
                                    {activity.date} • {activity.time}
                                  </span>
                                  <div className="w-6 h-6 rounded-md bg-[#12111A] border border-white/[0.04] flex items-center justify-center transition-transform duration-300">
                                    <ChevronRight className={`w-3.5 h-3.5 text-[#F5F5F4] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                  </div>
                                </div>
                              </button>

                              {/* Mobile Friendly Date Tag */}
                              <div className="sm:hidden text-[11px] font-mono font-medium text-[#A8A29E]">
                                {activity.date} • {activity.time}
                              </div>

                              {/* Smooth Collapsible Area */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-3.5 border-t border-white/[0.04] space-y-4">
                                      <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                                        {activity.description}
                                      </p>

                                      {/* Key Value Details Block */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {activity.details.map((detail, idx) => (
                                          <div key={idx} className="bg-[#12111A]/60 border border-white/[0.04] rounded-xl p-3 flex flex-col justify-between">
                                            <span className="text-[9px] uppercase font-semibold tracking-wider text-[#A8A29E]">
                                              {detail.label}
                                            </span>
                                            <span className="text-xs sm:text-sm font-medium text-[#F5F5F4] leading-relaxed truncate mt-0.5">
                                              {detail.value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Interactive Button Actions */}
                                      {activity.actions && activity.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                          {activity.actions.map((act, actIdx) => (
                                            <button
                                              key={actIdx}
                                              onClick={() => act.onClick(showNotification)}
                                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                act.primary 
                                                  ? 'bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] shadow-sm hover:-translate-y-0.5' 
                                                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-[#D6D3D1] border border-white/[0.04]'
                                              }`}
                                            >
                                              {act.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Quick Inspiration / Tips */}
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl md:text-[30px] font-display font-bold text-[#F5F5F4] tracking-tight">Studio Tips</h3>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed font-normal">Curated planning insights.</p>
          </div>

          <Card id="studio-tips-card" className="border-white/[0.04] bg-gradient-to-b from-[#12111A] to-[#0A0910] rounded-[20px] shadow-2xl relative overflow-hidden group">
            {/* Soft decorative background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#6C4CF1]/5 rounded-full blur-[40px] pointer-events-none" />

            <CardBody className="p-6 sm:p-7 space-y-6">
              {/* Header with AI icon & Gold accent */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/5">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#B4A2FF]">AI Studio Assistant</span>
                    <h4 className="text-base font-semibold text-[#F5F5F4] leading-none mt-0.5">Smart Recommendations</h4>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/15 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Active
                </span>
              </div>
              
              {/* Elegant cards containing tips */}
              <div className="space-y-4">
                {/* Tip 1 */}
                <div className="p-4 bg-[#151421]/60 border border-white/[0.04] rounded-[16px] hover:border-amber-500/20 hover:bg-[#151421]/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group/tip flex gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(244,180,0,0.5)]" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">Catering & Photography</p>
                    <p className="text-sm text-[#D6D3D1] group-hover/tip:text-[#F5F5F4] transition-colors leading-relaxed font-normal">
                      Book photographers 4–6 weeks before birthdays.
                    </p>
                  </div>
                </div>

                {/* Tip 2 */}
                <div className="p-4 bg-[#151421]/60 border border-white/[0.04] rounded-[16px] hover:border-[#6C4CF1]/25 hover:bg-[#151421]/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group/tip flex gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6C4CF1] shrink-0 mt-1.5 shadow-[0_0_8px_rgba(108,76,241,0.5)]" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-[#B4A2FF] uppercase tracking-wider font-semibold">Local Demand Spike</p>
                    <p className="text-sm text-[#D6D3D1] group-hover/tip:text-[#F5F5F4] transition-colors leading-relaxed font-normal">
                      Popular venues in Kwara are filling quickly.
                    </p>
                  </div>
                </div>

                {/* Tip 3 */}
                <div className="p-4 bg-[#151421]/60 border border-white/[0.04] rounded-[16px] hover:border-emerald-500/25 hover:bg-[#151421]/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group/tip flex gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">Scheduling Optimization</p>
                    <p className="text-sm text-[#D6D3D1] group-hover/tip:text-[#F5F5F4] transition-colors leading-relaxed font-normal">
                      AI recommends planning weekends early.
                    </p>
                  </div>
                </div>
              </div>

              {/* Elegant Button */}
              <button
                onClick={() => {
                  showNotification("Analyzing historical data to synthesize deeper custom birthday advice...");
                }}
                className="w-full py-3 bg-[#151421] hover:bg-[#6C4CF1] border border-white/[0.04] hover:border-[#6C4CF1]/20 rounded-xl text-xs font-semibold text-[#D6D3D1] hover:text-[#F5F5F4] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(108,76,241,0.2)] text-center cursor-pointer font-sans tracking-wide uppercase"
              >
                Explore More Tips
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modals for Premium Interactivity (State Handled client-side gracefully) */}
      <AnimatePresence>
        
        {/* Modal A: AI Suggestions Theme Ideas */}
        {activeSuggestionModal && (
          <div id="ai-suggestion-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSuggestionModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-[#12111A] rounded-[24px] p-6 md:p-8 shadow-2xl space-y-6 z-10 border border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveSuggestionModal(false)}
                className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#F5F5F4] transition-colors p-1.5 rounded-full hover:bg-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 text-[#B4A2FF]">
                  <Wand2 className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest font-semibold">Generated Just Now</span>
                </div>
                <h3 className="text-2xl font-display font-semibold text-[#F5F5F4] tracking-tight">
                  Dynamic Studio Themes
                </h3>
                <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                  Our advanced AI models formulated these highly customized event directives based on your layout preferences:
                </p>
              </div>

              <div className="space-y-4">
                {aiThemes.map((theme, i) => (
                  <div key={theme.title} className="p-4 bg-[#0A0910]/75 border border-white/[0.04] rounded-[16px] hover:border-[#6C4CF1]/30 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#F5F5F4]">{theme.title}</h4>
                      <span className="text-[9px] font-mono bg-[#6C4CF1]/10 text-[#B4A2FF] border border-[#6C4CF1]/15 px-2 py-0.5 rounded-full font-semibold">{theme.ageGroup}</span>
                    </div>
                    <p className="text-[11px] text-[#B4A2FF] font-medium mt-1 font-sans">Vibe: {theme.vibe}</p>
                    <p className="text-xs text-[#D6D3D1] leading-relaxed font-normal mt-1.5">{theme.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex space-x-3">
                <Button
                  onClick={() => {
                    setActiveSuggestionModal(false);
                    onPlanBirthday();
                  }}
                  variant="primary"
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] py-3 text-xs uppercase font-semibold tracking-wider rounded-xl transition-all"
                >
                  Apply in Planning Wizard
                </Button>
                <Button
                  onClick={() => setActiveSuggestionModal(false)}
                  variant="secondary"
                  className="border-white/[0.04] hover:border-white/[0.08] bg-white/[0.02] text-[#D6D3D1] hover:text-[#F5F5F4] py-3 text-xs uppercase font-semibold tracking-wider rounded-xl transition-all"
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal B: Quick Actions detail modal */}
        {activeQuickActionModal && (
          <div id="quick-action-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveQuickActionModal(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#12111A] rounded-[24px] p-6 shadow-2xl text-center space-y-6 z-10 border border-white/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveQuickActionModal(null)}
                className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#F5F5F4] transition-colors p-1.5 rounded-full hover:bg-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-14 h-14 bg-[#0A0910] border border-white/[0.04] rounded-2xl flex items-center justify-center">
                {activeQuickActionModal.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-semibold text-[#F5F5F4] tracking-tight">
                  {activeQuickActionModal.title}
                </h3>
                <p className="text-sm text-[#D6D3D1] leading-relaxed font-normal">
                  {activeQuickActionModal.desc}
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[11px] font-mono rounded-xl font-semibold uppercase tracking-wider flex items-center justify-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span>Premium Feature Active</span>
              </div>

              <div className="pt-2 flex space-x-3">
                <Button
                  onClick={() => {
                    const actionName = activeQuickActionModal.title;
                    setActiveQuickActionModal(null);
                    if (actionName.includes("Photography") || actionName.includes("Caterers") || actionName.includes("Entertainment")) {
                      onBrowseVendors();
                      showNotification(`Viewing vendors catalog related to ${actionName}!`);
                    } else {
                      onPlanBirthday();
                      showNotification(`Starting wizard flow with specialized focus: ${actionName}!`);
                    }
                  }}
                  variant="primary"
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 text-[#F5F5F4] py-3 text-xs uppercase font-semibold tracking-wider rounded-xl transition-all"
                >
                  Activate Focus Flow
                </Button>
                <Button
                  onClick={() => setActiveQuickActionModal(null)}
                  variant="secondary"
                  className="border-white/[0.04] hover:border-white/[0.08] bg-white/[0.02] text-[#D6D3D1] hover:text-[#F5F5F4] py-3 text-xs uppercase font-semibold tracking-wider rounded-xl transition-all"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && renderInvoiceModal()}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isProcessingPayment && renderCheckoutModal()}
      </AnimatePresence>

    </div>
  );
};
