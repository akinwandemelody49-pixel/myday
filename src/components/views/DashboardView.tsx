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
import { User } from '../../types';
import { getBookings, updateBookingStatus, DBBooking } from '../../services/db_services';
import { SAMPLE_VENDORS } from '../../services/db';

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
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [activeSuggestionModal, setActiveSuggestionModal] = useState<boolean>(false);
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<{title: string; desc: string; icon: React.ReactNode} | null>(null);

  // Real-time booking ledgers
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<DBBooking | null>(null);

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
        <Card className="border-neutral-100 bg-white">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-600">
              <Receipt className="w-6 h-6 text-neutral-500" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Total Booked Volume</p>
              <h4 className="text-2xl font-display font-black text-neutral-800 mt-1">
                ₦{totalBooked.toLocaleString()}
              </h4>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-neutral-100 bg-white">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Paid & Settled</p>
              <h4 className="text-2xl font-display font-black text-emerald-600 mt-1">
                ₦{paidAmount.toLocaleString()}
              </h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-neutral-100 bg-white">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Outstanding Balances</p>
              <h4 className="text-2xl font-display font-black text-amber-600 mt-1">
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
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-neutral-100 space-y-3">
          <Loader2 className="w-8 h-8 text-[#6C4CF1] animate-spin" />
          <p className="text-xs text-neutral-400 font-light">Loading reservation ledger from Firestore...</p>
        </div>
      );
    }

    const listToDisplay = isLimit ? bookings.slice(0, 3) : bookings;

    if (listToDisplay.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-neutral-200 p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100">
            <CreditCard className="w-6 h-6 text-neutral-300" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-neutral-800">No active bookings found</h4>
            <p className="text-xs text-neutral-400 font-light max-w-sm mx-auto">
              You haven't initiated any boutique vendor requests. Once you request availability, reservation invoices will appear here in real-time.
            </p>
          </div>
          <Button
            onClick={onBrowseVendors}
            variant="outline"
            className="border-neutral-200 hover:border-[#6C4CF1] hover:text-[#6C4CF1] text-xs px-4 py-2"
          >
            Explore Bespoke Directory
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {listToDisplay.map((booking) => {
          const vendor = SAMPLE_VENDORS.find(v => v.id === booking.vendorId);
          const vendorName = vendor?.name || 'Boutique Service Partner';
          const vendorCategory = vendor?.category || 'Service';
          const vendorImage = vendor?.imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400';

          return (
            <Card key={booking.id} className="border-neutral-100 bg-white hover:shadow-xs transition-shadow duration-200">
              <CardBody className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 shrink-0">
                    <img src={vendorImage} alt={vendorName} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase bg-[#6C4CF1]/10 text-[#6C4CF1] px-2 py-0.5 rounded-md font-bold">
                        {vendorCategory}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        INV-{booking.id?.toUpperCase().slice(0, 8) || 'PENDING'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-800">{vendorName}</h4>
                    <div className="flex items-center text-[10px] text-neutral-400 space-x-3 font-sans">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-neutral-400" />
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Reservation status: {booking.bookingStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-50">
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase font-bold text-neutral-400">Invoice Total</p>
                    <p className="text-sm font-display font-black text-neutral-800 mt-0.5">
                      ₦{booking.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Payment status badge */}
                    {booking.paymentStatus === 'paid' ? (
                      <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </div>
                    ) : booking.paymentStatus === 'refunded' ? (
                      <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </div>
                    )}

                    {/* Invoice Details Trigger */}
                    <button
                      onClick={() => setSelectedInvoice(booking)}
                      className="p-2 text-neutral-500 hover:text-[#6C4CF1] hover:bg-neutral-50 rounded-xl transition-all"
                      title="View & Download Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Pay Now Trigger */}
                    {(booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partial') && (
                      <Button
                        onClick={() => setIsProcessingPayment(booking.id || null)}
                        className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider"
                      >
                        Pay Now
                      </Button>
                    )}
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
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 z-10 border border-neutral-100 font-sans"
        >
          <button 
            onClick={() => setSelectedInvoice(null)}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-full hover:bg-neutral-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-start border-b border-neutral-100 pb-5">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
                <span>MyDay</span>
                <span className="text-[#6C4CF1] text-xs font-mono font-bold px-1.5 py-0.5 bg-[#6C4CF1]/8 rounded-md">STUDIO</span>
              </h3>
              <p className="text-[10px] text-neutral-400 font-light tracking-wide uppercase font-mono">Bespoke Event Invoicing</p>
            </div>
            
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                selectedInvoice.paymentStatus === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {selectedInvoice.paymentStatus.toUpperCase()}
              </span>
              <p className="text-[10px] font-mono text-neutral-400 mt-1.5">INV-{selectedInvoice.id?.toUpperCase().slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold text-neutral-400">Invoiced To:</p>
              <p className="font-bold text-neutral-800 mt-1">{user.displayName || 'Bespoke Client'}</p>
              <p className="text-neutral-500 font-light">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase font-bold text-neutral-400">Payment Due:</p>
              <p className="font-bold text-neutral-800 mt-1">{new Date(selectedInvoice.bookingDate).toLocaleDateString()}</p>
              <p className="text-neutral-500 font-light">Status: {selectedInvoice.bookingStatus}</p>
            </div>
          </div>

          <div className="border-t border-b border-neutral-100 py-4 space-y-3 text-xs">
            <p className="text-[10px] font-mono uppercase font-bold text-neutral-400">Ledger Details</p>
            <div className="flex justify-between text-neutral-700">
              <span>{vendorName} Reservation Base Cost</span>
              <span className="font-mono font-semibold">₦{selectedInvoice.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-500 font-light">
              <span>Studio Coordination Fee (10%)</span>
              <span className="font-mono">₦{(selectedInvoice.totalAmount * 0.1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-500 font-light">
              <span>Value-Added Tax (7.5%)</span>
              <span className="font-mono">₦{(selectedInvoice.totalAmount * 0.075).toLocaleString()}</span>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="flex justify-between font-bold text-neutral-900 text-sm">
              <span>Total Amount Due</span>
              <span className="font-mono text-[#6C4CF1]">₦{totalDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <Button
              onClick={() => downloadInvoiceText(selectedInvoice, vendorName)}
              variant="primary"
              className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] py-3 text-xs uppercase font-bold tracking-wider rounded-xl flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </Button>
            <Button
              onClick={() => setSelectedInvoice(null)}
              variant="secondary"
              className="border-neutral-200 hover:bg-neutral-50 text-neutral-700 py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
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
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-6 z-10 border border-neutral-100 font-sans"
        >
          <button 
            onClick={() => setIsProcessingPayment(null)}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-full hover:bg-neutral-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-[#6C4CF1]/10 rounded-2xl flex items-center justify-center text-[#6C4CF1] mb-2">
              <CreditCard className="w-6 h-6 text-[#6C4CF1]" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-neutral-900 tracking-tight">
              Boutique Checkout Portal
            </h3>
            <p className="text-xs text-neutral-400 font-light">
              Securely finalize reservation for <strong className="text-neutral-700">{vendorName}</strong>.
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-2.5 text-xs">
            <div className="flex justify-between text-neutral-500 font-light">
              <span>Reservation Ref:</span>
              <span className="font-mono text-neutral-700">INV-{booking.id?.toUpperCase().slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 font-light">
              <span>Booking Date:</span>
              <span className="text-neutral-700">{new Date(booking.bookingDate).toLocaleDateString()}</span>
            </div>
            <div className="h-px bg-neutral-200/50 my-1" />
            <div className="flex justify-between font-bold text-neutral-900">
              <span>Amount Due (incl. Tax & Fees):</span>
              <span className="font-mono text-[#6C4CF1]">₦{totalDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#6C4CF1] bg-[#6C4CF1]/4 p-3 rounded-xl flex items-center space-x-2.5 cursor-pointer">
                <CheckCircle className="w-4 h-4 text-[#6C4CF1] fill-[#6C4CF1]/10" />
                <span className="text-xs font-semibold text-neutral-800">MyDay Balance</span>
              </div>
              <div className="border border-neutral-200 hover:border-neutral-300 p-3 rounded-xl flex items-center space-x-2.5 cursor-pointer opacity-60" onClick={() => showNotification("Card processor disabled in sandbox mode. Please use local Balance.")}>
                <div className="w-4 h-4 rounded-full border border-neutral-300 shrink-0" />
                <span className="text-xs font-semibold text-neutral-600">Credit Card</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex space-x-3">
            <Button
              onClick={() => handleExecutePayment(booking)}
              disabled={loadingBookings}
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-700 border-none py-3 text-xs uppercase font-bold tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              {loadingBookings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Confirm & Pay ₦{totalDue.toLocaleString()}</span>
            </Button>
            <Button
              onClick={() => setIsProcessingPayment(null)}
              variant="secondary"
              className="border-neutral-200 hover:bg-neutral-50 text-neutral-700 py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
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

  // Fully route payments layout when forceShowPayments is activated
  if (forceShowPayments) {
    return (
      <div id="premium-payments-container" className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 font-sans">
        {/* Payments Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center text-xs font-semibold text-[#6C4CF1] hover:underline mb-1.5 transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
            <h2 className="text-3xl font-display font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-[#6C4CF1]" />
              <span>Payments & Invoices</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-500 font-light">
              Track active boutique reservations, settle outstanding invoices in real-time, and download professional records.
            </p>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            <Button
              onClick={onBrowseVendors}
              variant="primary"
              className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl flex items-center space-x-2 shadow-xs transition-all"
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
    <div id="premium-dashboard-container" className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      
      {/* 1. Hero Welcome Segment */}
      <div 
        id="dashboard-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-radial from-[#6C4CF1]/8 to-[#6C4CF1]/2 border border-[#6C4CF1]/10 p-8 md:p-12 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C4CF1]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#F4B400]/4 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16"></div>

        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#6C4CF1]/10 text-[#6C4CF1] rounded-full text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B400] animate-spin" />
            <span>Premium Studio Membership</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-neutral-900 tracking-tight">
            {getGreeting()}, {user.displayName || 'Guest'} 👋
          </h2>
          <p className="text-sm md:text-base text-neutral-500 font-light leading-relaxed">
            Ready to create another unforgettable celebration? Design timelines, match premium vendors, and customize experiences.
          </p>
        </div>

        <div className="flex items-center space-x-3.5 z-10 shrink-0">
          <Button
            id="hero-plan-birthday-btn"
            onClick={onPlanBirthday}
            variant="primary"
            className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#6C4CF1]/15 flex items-center space-x-2"
          >
            <Cake className="w-4 h-4 text-[#F4B400]" />
            <span>Plan a Birthday</span>
          </Button>
          <Button
            id="hero-browse-vendors-btn"
            onClick={onBrowseVendors}
            variant="secondary"
            className="border-neutral-200 hover:border-[#6C4CF1] bg-white text-neutral-700 hover:text-[#6C4CF1] px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            Browse Vendors
          </Button>
        </div>
      </div>

      {/* 2. Core Dashboard Cards Grid */}
      <div id="core-cards-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Saved Plans */}
        <Card 
          id="saved-plans-card"
          className="border-neutral-100 hover:border-[#6C4CF1]/30 hover:shadow-lg hover:shadow-neutral-100/50 transition-all duration-300 cursor-pointer group bg-white"
          onClick={() => onNavigateTab('planner')}
        >
          <CardBody className="p-6 space-y-4">
            <div className="w-12 h-12 bg-[#6C4CF1]/10 rounded-2xl flex items-center justify-center text-[#6C4CF1] transition-all duration-300 group-hover:scale-105">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center justify-between">
                <span>Saved Plans</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#6C4CF1] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                View and manage your saved birthday plans.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Upcoming Celebrations */}
        <Card 
          id="upcoming-celebrations-card"
          className="border-neutral-100 hover:border-[#6C4CF1]/30 hover:shadow-lg hover:shadow-neutral-100/50 transition-all duration-300 cursor-pointer group bg-white"
          onClick={() => onNavigateTab('planner')}
        >
          <CardBody className="p-6 space-y-4">
            <div className="w-12 h-12 bg-[#F4B400]/10 rounded-2xl flex items-center justify-center text-[#F4B400] transition-all duration-300 group-hover:scale-105">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center justify-between">
                <span>Upcoming Celebrations</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#6C4CF1] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                See birthdays you've planned and upcoming reminders.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Favorite Vendors */}
        <Card 
          id="favorite-vendors-card"
          className="border-neutral-100 hover:border-[#6C4CF1]/30 hover:shadow-lg hover:shadow-neutral-100/50 transition-all duration-300 cursor-pointer group bg-white"
          onClick={() => onNavigateTab('vendors')}
        >
          <CardBody className="p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 transition-all duration-300 group-hover:scale-105">
              <Heart className="w-6 h-6 fill-rose-50" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center justify-between">
                <span>Favorite Vendors</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#6C4CF1] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                Quick access to your trusted vendors.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 4: AI Suggestions */}
        <Card 
          id="ai-suggestions-card"
          className="border-neutral-100 hover:border-[#6C4CF1]/30 hover:shadow-lg hover:shadow-neutral-100/50 transition-all duration-300 cursor-pointer group bg-white relative overflow-hidden"
          onClick={() => setActiveSuggestionModal(true)}
        >
          {/* subtle gold corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F4B400]/10 rounded-full blur-md"></div>
          <CardBody className="p-6 space-y-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 transition-all duration-300 group-hover:scale-105">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-800 flex items-center justify-between">
                <span>AI Suggestions</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#6C4CF1] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1.5 leading-relaxed">
                Personalized birthday ideas generated by AI.
              </p>
            </div>
          </CardBody>
        </Card>

      </div>

      {/* 3. Quick Actions Grid */}
      <div id="quick-actions-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-900 tracking-tight">Quick Actions</h3>
            <p className="text-xs text-neutral-400 font-light">Direct pathways to design components of your perfect day.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Action 1: Plan Birthday */}
          <button
            id="qa-plan-birthday"
            onClick={onPlanBirthday}
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#6C4CF1]/8 rounded-xl flex items-center justify-center text-[#6C4CF1] mb-3 group-hover:scale-110 transition-transform">
              <Cake className="w-5 h-5 text-[#6C4CF1]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
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
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
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
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#6C4CF1]/8 rounded-xl flex items-center justify-center text-[#6C4CF1] mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
              Decorations
            </span>
          </button>

          {/* Action 4: Photography */}
          <button
            id="qa-photography"
            onClick={() => setActiveQuickActionModal({
              title: "Photography Matcher",
              desc: "Instantly match with top local event photographers, photo booth agencies, and videographers matching your date.",
              icon: <Camera className="w-8 h-8 text-sky-500" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 mb-3 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
              Photography
            </span>
          </button>

          {/* Action 5: Restaurants */}
          <button
            id="qa-restaurants"
            onClick={() => setActiveQuickActionModal({
              title: "Premium Caterers & Venues",
              desc: "Discover unique dining experiences, food trucks, mixologist bars, and gourmet sit-down menus tailored for celebrations.",
              icon: <Utensils className="w-8 h-8 text-emerald-500" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
              Restaurants
            </span>
          </button>

          {/* Action 6: Entertainment */}
          <button
            id="qa-entertainment"
            onClick={() => setActiveQuickActionModal({
              title: "Entertainment & Live Events",
              desc: "From professional DJs and saxophonists to magical illusionists and custom trivia hosts, find the heartbeat of your party.",
              icon: <Music className="w-8 h-8 text-indigo-500" />
            })}
            className="flex flex-col items-center justify-center text-center p-5 bg-white border border-neutral-100 hover:border-[#6C4CF1] rounded-2xl hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 group-hover:text-neutral-800 font-sans">
              Entertainment
            </span>
          </button>

        </div>
      </div>

      {/* Real-time Payments Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#6C4CF1]" />
              <span>Real-time Bookings & Payments</span>
            </h3>
            <p className="text-xs text-neutral-400 font-light">
              Active vendor reservations and digital invoices linked directly to your Firestore node.
            </p>
          </div>
          <button 
            onClick={() => onNavigateTab('payments')}
            className="text-xs font-semibold text-[#6C4CF1] hover:underline flex items-center animate-pulse"
          >
            <span>View All Payments</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {renderPaymentsList(true)}
      </div>

      {/* 4. Secondary Information (Recent Activity & Profile Snapshot) */}
      <div id="activity-profile-split" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-900 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-neutral-400 font-light">Keep track of the details you've finalized recently.</p>
          </div>

          <Card id="recent-activity-card" className="border-neutral-100 shadow-xs bg-white">
            <CardBody className="p-0">
              <div className="divide-y divide-neutral-50">
                
                {/* Activity 1 */}
                <div className="p-5 flex items-start space-x-4">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <p className="text-xs font-semibold text-neutral-800">
                      Birthday plan created
                    </p>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Successfully designed a whimsical pastel balloon setup for Jordan's 6th party.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">12m ago</span>
                </div>

                {/* Activity 2 */}
                <div className="p-5 flex items-start space-x-4">
                  <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                    <Bookmark className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <p className="text-xs font-semibold text-neutral-800">
                      Vendor bookmarked
                    </p>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Added 'Sugar&Spice Patisserie' to your favorites list for artisanal dessert catering.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">2h ago</span>
                </div>

                {/* Activity 3 */}
                <div className="p-5 flex items-start space-x-4">
                  <div className="w-9 h-9 bg-[#6C4CF1]/10 rounded-xl flex items-center justify-center text-[#6C4CF1] shrink-0">
                    <PartyPopper className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <p className="text-xs font-semibold text-neutral-800">
                      Celebration completed
                    </p>
                    <p className="text-[11px] text-neutral-400 font-light">
                      The Neon Glow arcade celebration was hosted successfully. Rate your experience!
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">2d ago</span>
                </div>

              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Quick Inspiration / Tips */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-900 tracking-tight">Studio Tips</h3>
            <p className="text-xs text-neutral-400 font-light">Curated planning insights.</p>
          </div>

          <Card id="studio-tips-card" className="border-[#6C4CF1]/10 bg-radial from-[#6C4CF1]/3 to-transparent">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-[#6C4CF1]">
                <Compass className="w-5 h-5" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Pro Advice</span>
              </div>
              
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-800">Book Early for High Season</h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-light">
                    Photographers and customized patisseries get booked out up to 4-6 weeks in advance during summer months. Match your dates today!
                  </p>
                </div>
                
                <div className="h-px bg-neutral-100" />

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-800">Use AI Theme Prompters</h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-light">
                    Type complex prompts in the wizard like 'cyberpunk botanical garden' to get highly unexpected custom ideas.
                  </p>
                </div>
              </div>
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
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 z-10 border border-neutral-100"
            >
              <button 
                onClick={() => setActiveSuggestionModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-full hover:bg-neutral-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 text-[#6C4CF1]">
                  <Wand2 className="w-5 h-5 text-[#F4B400] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">Generated Just Now</span>
                </div>
                <h3 className="text-2xl font-display font-extrabold text-neutral-900 tracking-tight">
                  Dynamic Studio Themes
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Our advanced AI models formulated these highly customized event directives based on your layout preferences:
                </p>
              </div>

              <div className="space-y-4">
                {aiThemes.map((theme, i) => (
                  <div key={theme.title} className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl hover:border-[#6C4CF1]/20 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-neutral-800">{theme.title}</h4>
                      <span className="text-[9px] font-mono bg-[#6C4CF1]/10 text-[#6C4CF1] px-2 py-0.5 rounded-full font-bold">{theme.ageGroup}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium mt-1 font-sans">Vibe: {theme.vibe}</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-light mt-1.5">{theme.desc}</p>
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
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
                >
                  Apply in Planning Wizard
                </Button>
                <Button
                  onClick={() => setActiveSuggestionModal(false)}
                  variant="secondary"
                  className="border-neutral-200 hover:bg-neutral-50 text-neutral-700 py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
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
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-center space-y-6 z-10 border border-neutral-100"
            >
              <button 
                onClick={() => setActiveQuickActionModal(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-full hover:bg-neutral-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-14 h-14 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center">
                {activeQuickActionModal.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-neutral-900 tracking-tight">
                  {activeQuickActionModal.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-light">
                  {activeQuickActionModal.desc}
                </p>
              </div>

              <div className="p-3.5 bg-[#F4B400]/5 border border-[#F4B400]/10 text-[#F4B400] text-[10px] font-mono rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Premium Feature Available</span>
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
                  className="w-full bg-[#6C4CF1] hover:bg-[#5B3ED6] py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
                >
                  Activate Focus Flow
                </Button>
                <Button
                  onClick={() => setActiveQuickActionModal(null)}
                  variant="secondary"
                  className="border-neutral-200 hover:bg-neutral-50 text-neutral-700 py-3 text-xs uppercase font-bold tracking-wider rounded-xl"
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
