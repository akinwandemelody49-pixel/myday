import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Building, MapPin, CheckCircle2, ChevronRight, 
  Upload, Loader2, ArrowRight, Phone, Mail, Store, Plus, X, 
  Trash2, ShieldCheck, Calendar, DollarSign, Image as ImageIcon, 
  AlertCircle, Star, Shield, ClipboardCheck, ArrowUpRight, Clock, ToggleLeft, Eye,
  LayoutDashboard, Settings, Bell, Edit, Check, Globe, Sliders, Award, FileSpreadsheet,
  Lock, AlertTriangle, PlusCircle, CheckSquare, HelpCircle, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { db } from '../../services/firebase';
import { 
  DBVendor, DBBooking, getBookingsForVendor, updateBookingStatus, updateVendor as originalUpdateVendor, addVendor
} from '../../services/db_services';
import { SAMPLE_VENDORS } from '../../services/db';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { BookingChatModal } from '../ui/BookingChatModal';
import { MessageSquare } from 'lucide-react';

const updateVendor = originalUpdateVendor as (id: string, data: any) => Promise<any>;

interface VendorDashboardViewProps {
  onGoHome: () => void;
  showNotification: (msg: string) => void;
}

const COLORS = ['#6C4CF1', '#F4B400', '#10B981', '#EF4444', '#EC4899', '#3B82F6'];

const KWARA_AREAS = [
  'Ilorin West', 'Ilorin East', 'Ilorin South', 'Offa', 'Omu-Aran', 
  'Patigi', 'Lafiagi', 'Kaiama', 'Moro', 'Oyun', 'Edu', 'Irepodun'
];

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({ 
  onGoHome, 
  showNotification 
}) => {
  // Connection and Session States
  const [vendorEmail, setVendorEmail] = useState('');
  const [activeVendor, setActiveVendor] = useState<any | null>(null);
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [chatBooking, setChatBooking] = useState<DBBooking | null>(null);

  // Tab State inside Dashboard
  const [dashboardTab, setDashboardTab] = useState<string>('overview');

  // Input States for Portfolio Upload
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extended features local states
  const [vendorServices, setVendorServices] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState({
    mondayFriday: '09:00 AM - 05:00 PM',
    saturday: '10:00 AM - 04:00 PM',
    sunday: 'Closed'
  });
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState({
    emailAlerts: true,
    smsAlerts: false,
    holidayMode: false,
    themePreference: 'light'
  });

  const [logoUrl, setLogoUrl] = useState('');
  const [portfolioCaptions, setPortfolioCaptions] = useState<Record<number, string>>({});

  // Edit Profile States
  const [profileForm, setProfileForm] = useState({
    vendorName: '',
    description: '',
    location: '',
    phone: '',
    priceRange: 'medium' as DBVendor['priceRange'],
  });

  // Service Management States
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: 0,
    description: '',
    available: true
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);

  // Filter Bookings state
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<DBBooking | null>(null);

  // Pre-seed mock bookings in Firestore if empty
  const seedMockBookingsIfEmpty = async (vendorId: string, category: string) => {
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
            bookingStatus: 'completed',
            totalAmount: category === 'Venues' || category === 'Restaurants' ? 550000 : 150000,
            paymentStatus: 'paid',
            bookingDate: '2026-07-10',
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
      const existing = await getBookingsForVendor(vendorId);
      setBookings(existing);
    }
  };

  // Resolve vendor email, claim approved applications, or load from SAMPLE_VENDORS
  const handleAccessDashboard = async (emailToSearch: string) => {
    if (!emailToSearch || !emailToSearch.includes('@')) {
      showNotification('Please enter a valid business email address.');
      return;
    }

    setIsLoading(true);
    try {
      const lowercaseEmail = emailToSearch.trim().toLowerCase();
      
      // 1. Search in Firestore /vendors/
      const vendorsRef = collection(db, 'vendors');
      const q = query(vendorsRef, where('email', '==', lowercaseEmail));
      const querySnapshot = await getDocs(q);
      
      let vendorDoc: any = null;
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        vendorDoc = { ...docSnap.data(), id: docSnap.id };
      } else {
        // 2. Search approved vendorApplications
        const appsRef = collection(db, 'vendorApplications');
        const qApps = query(appsRef, where('email', '==', lowercaseEmail));
        const appsSnapshot = await getDocs(qApps);
        
        if (!appsSnapshot.empty) {
          const appDoc = appsSnapshot.docs[0].data();
          if (appDoc.status === 'Approved') {
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
              location: `${appDoc.city || 'Ilorin'}, Kwara State`,
              images: appDoc.portfolioImages && appDoc.portfolioImages.length > 0 ? appDoc.portfolioImages : [appDoc.logo || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3'],
              phone: appDoc.phone || '+234 803 123 4567',
              email: lowercaseEmail,
              rating: 5.0,
              priceRange: 'medium',
              verified: true,
              availabilityStatus: 'Available'
            };

            const generatedId = await addVendor(newVendorPayload);
            vendorDoc = { ...newVendorPayload, id: generatedId };
            showNotification('Aesthetic vendor profile officially activated!');
          }
        }
      }

      // 3. Fallback to SAMPLE_VENDORS
      if (!vendorDoc) {
        const matchedSample = SAMPLE_VENDORS.find(
          v => v.contactEmail?.toLowerCase() === lowercaseEmail || v.id === lowercaseEmail
        );

        if (matchedSample) {
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
          await setDoc(doc(db, 'vendors', generatedId), newVendorPayload);
          vendorDoc = { ...newVendorPayload, id: generatedId };
        }
      }

      if (vendorDoc) {
        setActiveVendor(vendorDoc);
        setProfileForm({
          vendorName: vendorDoc.vendorName,
          description: vendorDoc.description,
          location: vendorDoc.location,
          phone: vendorDoc.phone || '',
          priceRange: vendorDoc.priceRange || 'medium',
        });

        // Initialize Extended States from Firestore document or premium defaults
        const initialServices = vendorDoc.services || [
          { id: 'srv-1', name: 'Premium Package Offering', price: vendorDoc.category === 'Venues' || vendorDoc.category === 'Restaurants' ? 350000 : 120000, description: 'Comprehensive delivery including all raw layouts, high-end tools, and personalized setup expert support.', available: true },
          { id: 'srv-2', name: 'Standard Half-Day Session', price: vendorDoc.category === 'Venues' || vendorDoc.category === 'Restaurants' ? 200000 : 75000, description: 'Efficient bundle suited for core birthday requirements with setup assistance.', available: true },
          { id: 'srv-3', name: 'Bespoke Advisory / Custom consultation', price: 25000, description: 'Professional expert planning hourly fee, thematic design planning, or customized troubleshooting.', available: true }
        ];
        setVendorServices(initialServices);

        const initialHours = vendorDoc.businessHours || {
          mondayFriday: '09:00 AM - 05:00 PM',
          saturday: '10:00 AM - 04:00 PM',
          sunday: 'Closed'
        };
        setBusinessHours(initialHours);

        const initialAreas = vendorDoc.serviceAreas || ['Ilorin East', 'Ilorin West', 'Ilorin South', 'Offa', 'Omu-Aran'];
        setServiceAreas(initialAreas);

        const initialReviews = vendorDoc.reviews || [
          { id: 'rev-1', userName: 'Tunde Johnson', rating: 5, comment: 'Phenomenal coordination and very polite staff! Strongly recommended for any birthday celebration.', date: '2026-07-02' },
          { id: 'rev-2', userName: 'Amina Kwara', rating: 4, comment: 'Highly punctual and professional. The setups were elegant and pristine.', date: '2026-06-28' },
          { id: 'rev-3', userName: 'Yusuf Ibrahim', rating: 5, comment: 'Exceeded all our expectations. Best birthday vendor choice in Kwara State hands down!', date: '2026-06-15' }
        ];
        setReviews(initialReviews);

        const initialNotifications = vendorDoc.notifications || [
          { id: 'not-1', title: 'New Booking Request Received', message: 'A client submitted an interactive booking request for 2026-07-25.', read: false, createdAt: new Date().toISOString() },
          { id: 'not-2', title: 'Security Verification Complete', message: 'Your business profile credentials have been verified on the Firestore ledger.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'not-3', title: 'Commission Payout Cleared', message: 'Your payment voucher INV-9018 net payout (90%) was processed successfully.', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() }
        ];
        setNotifications(initialNotifications);

        const initialSettings = vendorDoc.settings || {
          emailAlerts: true,
          smsAlerts: false,
          holidayMode: vendorDoc.availabilityStatus === 'On Break',
          themePreference: 'light'
        };
        setSettingsForm(initialSettings);

        setLogoUrl(vendorDoc.logo || vendorDoc.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150');
        
        if (vendorDoc.portfolioCaptions) {
          setPortfolioCaptions(vendorDoc.portfolioCaptions);
        }

        // Load & seed bookings
        await seedMockBookingsIfEmpty(vendorDoc.id!, vendorDoc.category);
        showNotification(`Welcome back to MyDay, ${vendorDoc.vendorName}!`);
        setDashboardTab('overview');
      } else {
        showNotification('No active or approved vendor found with that email.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error logging in. Please check connection and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Availability Status
  const handleUpdateAvailability = async (status: DBVendor['availabilityStatus']) => {
    if (!activeVendor || !activeVendor.id) return;
    
    setIsActionLoading('availability');
    try {
      await updateVendor(activeVendor.id, { availabilityStatus: status });
      setActiveVendor({
        ...activeVendor,
        availabilityStatus: status
      });
      setSettingsForm(prev => ({ ...prev, holidayMode: status === 'On Break' }));
      showNotification(`Availability updated to "${status}" successfully!`);
    } catch (err) {
      showNotification('Could not save availability.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Save profile and custom attributes (Logo, hours, service areas)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor || !activeVendor.id) return;

    setIsActionLoading('profile');
    try {
      const updatedPayload = {
        ...profileForm,
        logo: logoUrl,
        businessHours,
        serviceAreas,
        portfolioCaptions,
        services: vendorServices,
        reviews,
        notifications,
        settings: settingsForm
      };

      await updateVendor(activeVendor.id, updatedPayload);
      setActiveVendor({
        ...activeVendor,
        ...updatedPayload
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
      const updatedCaptions = { ...portfolioCaptions };
      delete updatedCaptions[indexToRemove];

      await updateVendor(activeVendor.id, { images: updatedImages, portfolioCaptions: updatedCaptions });
      setActiveVendor({
        ...activeVendor,
        images: updatedImages
      });
      setPortfolioCaptions(updatedCaptions);
      showNotification('Image removed from portfolio.');
    } catch (err) {
      showNotification('Failed to remove portfolio image.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Organize Gallery (Move photo order)
  const handleMoveImage = async (index: number, direction: 'left' | 'right') => {
    if (!activeVendor || !activeVendor.images) return;
    const images = [...activeVendor.images];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIdx < 0 || targetIdx >= images.length) return;
    
    // Swap images
    const temp = images[index];
    images[index] = images[targetIdx];
    images[targetIdx] = temp;
    
    // Swap captions
    const updatedCaptions = { ...portfolioCaptions };
    const cap1 = updatedCaptions[index] || '';
    const cap2 = updatedCaptions[targetIdx] || '';
    updatedCaptions[index] = cap2;
    updatedCaptions[targetIdx] = cap1;

    setIsActionLoading('reorder-portfolio');
    try {
      await updateVendor(activeVendor.id!, { images, portfolioCaptions: updatedCaptions });
      setActiveVendor({
        ...activeVendor,
        images
      });
      setPortfolioCaptions(updatedCaptions);
      showNotification('Gallery organization updated successfully!');
    } catch (err) {
      showNotification('Failed to update gallery order.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Save caption change for portfolio
  const handleUpdateCaption = async (index: number, val: string) => {
    const updatedCaptions = {
      ...portfolioCaptions,
      [index]: val
    };
    setPortfolioCaptions(updatedCaptions);
    
    if (activeVendor && activeVendor.id) {
      try {
        await updateVendor(activeVendor.id, { portfolioCaptions: updatedCaptions });
      } catch (err) {
        console.warn('Could not auto-save caption in Firestore', err);
      }
    }
  };

  // Handle Drag & Drop / File Select portfolio uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVendor || !activeVendor.id) return;

    setIsUploading(true);
    showNotification('Processing and uploading image asset...');

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
    }, 1200);
  };

  // Manage Booking Status changes
  const handleUpdateBooking = async (bookingId: string, nextStatus: DBBooking['bookingStatus']) => {
    setIsActionLoading(bookingId);
    try {
      const nextPaymentStatus: DBBooking['paymentStatus'] = nextStatus === 'completed' ? 'paid' : 'unpaid';
      await updateBookingStatus(bookingId, nextStatus, nextPaymentStatus);
      
      setBookings(prev => prev.map(b => b.id === bookingId ? { 
        ...b, 
        bookingStatus: nextStatus,
        paymentStatus: nextPaymentStatus
      } : b));

      // Append real-time notification
      const newNotification = {
        id: `not-${Date.now()}`,
        title: `Booking Update`,
        message: `Reservation ID INV-${bookingId.slice(0, 8).toUpperCase()} was marked as ${nextStatus}.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      if (activeVendor && activeVendor.id) {
        await updateVendor(activeVendor.id, { notifications: updatedNotifications });
      }

      showNotification(`Booking request successfully marked as ${nextStatus}!`);
      if (selectedBookingDetails?.id === bookingId) {
        setSelectedBookingDetails(prev => prev ? { ...prev, bookingStatus: nextStatus, paymentStatus: nextPaymentStatus } : null);
      }
    } catch (err) {
      showNotification('Failed to update booking status.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- Services CRUD Handlers ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor || !activeVendor.id) return;

    setIsActionLoading('service-save');
    try {
      let updatedServices = [...vendorServices];
      if (editingServiceId) {
        // Edit Mode
        updatedServices = updatedServices.map(s => 
          s.id === editingServiceId ? { ...s, ...serviceForm } : s
        );
        showNotification('Service offering successfully updated!');
      } else {
        // Add Mode
        const newService = {
          id: `srv-${Date.now()}`,
          ...serviceForm
        };
        updatedServices.push(newService);
        showNotification('New service offering added successfully!');
      }

      await updateVendor(activeVendor.id, { services: updatedServices });
      setVendorServices(updatedServices);
      
      // Reset Form
      setServiceForm({ name: '', price: 0, description: '', available: true });
      setEditingServiceId(null);
      setIsAddingService(false);
    } catch (err) {
      showNotification('Could not save service offering.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!activeVendor || !activeVendor.id) return;
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    setIsActionLoading(`service-delete-${serviceId}`);
    try {
      const updatedServices = vendorServices.filter(s => s.id !== serviceId);
      await updateVendor(activeVendor.id, { services: updatedServices });
      setVendorServices(updatedServices);
      showNotification('Service offering removed successfully.');
    } catch (err) {
      showNotification('Could not delete service offering.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleServiceAvailability = async (serviceId: string) => {
    if (!activeVendor || !activeVendor.id) return;

    setIsActionLoading(`service-toggle-${serviceId}`);
    try {
      const updatedServices = vendorServices.map(s => 
        s.id === serviceId ? { ...s, available: !s.available } : s
      );
      await updateVendor(activeVendor.id, { services: updatedServices });
      setVendorServices(updatedServices);
      showNotification('Service availability status updated.');
    } catch (err) {
      showNotification('Could not update service availability.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- Notification Center Handlers ---
  const handleMarkAllNotificationsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (activeVendor && activeVendor.id) {
      await updateVendor(activeVendor.id, { notifications: updated });
    }
    showNotification('All notifications marked as read.');
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    if (activeVendor && activeVendor.id) {
      await updateVendor(activeVendor.id, { notifications: [] });
    }
    showNotification('Notification history cleared.');
  };

  const handleDismissNotification = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    if (activeVendor && activeVendor.id) {
      await updateVendor(activeVendor.id, { notifications: updated });
    }
  };

  // --- Settings Preferences Saving ---
  const handleSaveSettings = async (newSettings: typeof settingsForm) => {
    setSettingsForm(newSettings);
    if (activeVendor && activeVendor.id) {
      const nextAvailability = newSettings.holidayMode ? 'On Break' : 'Available';
      try {
        await updateVendor(activeVendor.id, { 
          settings: newSettings,
          availabilityStatus: nextAvailability
        });
        setActiveVendor({
          ...activeVendor,
          availabilityStatus: nextAvailability,
          settings: newSettings
        });
        showNotification('Settings and holiday preferences synchronized with Firestore.');
      } catch (err) {
        showNotification('Could not save settings.');
      }
    }
  };

  // --- CSV Spreadsheet Export ---
  const handleExportEarningsCSV = () => {
    if (!activeVendor || bookings.length === 0) {
      showNotification('No earnings ledger data to export.');
      return;
    }

    try {
      const headers = [
        'Booking ID', 'Customer Name', 'Customer Email', 'Event Date', 
        'Invoicing Status', 'Job Status', 'Gross Value (NGN)', 
        'Platform Fee (10%)', 'Net Vendor Payout (90%)'
      ];
      
      const rows = bookings.map(b => {
        const gross = b.totalAmount || 0;
        const comm = gross * 0.10;
        const payout = gross * 0.90;
        return [
          `MYD-${b.id?.slice(0, 8).toUpperCase() || 'TX-2026'}`,
          b.userName || 'Premium Client',
          b.userEmail || 'N/A',
          b.bookingDate || 'N/A',
          b.paymentStatus.toUpperCase(),
          b.bookingStatus.toUpperCase(),
          gross,
          comm,
          payout
        ];
      });

      const csvContent = [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeVendor.vendorName.replace(/\s+/g, '_')}_Disbursements_Statement.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Detailed financial statement exported to CSV!');
    } catch (err) {
      showNotification('Failed to compile CSV spreadsheet.');
    }
  };

  // Statistics & Financial calculations
  const totalBookingsCount = bookings.length;
  const pendingRequestsCount = bookings.filter(b => b.bookingStatus === 'pending').length;
  const completedJobsCount = bookings.filter(b => b.bookingStatus === 'completed').length;
  const activeBookingsCount = bookings.filter(b => b.bookingStatus === 'confirmed').length;

  const grossEarnings = bookings
    .filter(b => b.bookingStatus === 'completed' || b.bookingStatus === 'confirmed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const platformFee = grossEarnings * 0.10;
  const netEarningsPayout = grossEarnings * 0.90;

  const avgRatingValue = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Bookings filter logic
  const getFilteredBookings = () => {
    if (bookingFilter === 'all') return bookings;
    return bookings.filter(b => b.bookingStatus === bookingFilter);
  };

  // Chart data generators
  const getEarningsTimelineData = () => {
    // Generate realistic earnings trend mapping over the past 5 active dates
    const dataMap: Record<string, number> = {
      '07-01': 0, '07-05': 0, '07-10': 0, '07-12': 0, '07-14': 0
    };

    bookings.forEach(b => {
      if (b.bookingStatus === 'completed' || b.bookingStatus === 'confirmed') {
        const dateStr = b.bookingDate ? b.bookingDate.slice(5, 10) : '07-10';
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] += b.totalAmount * 0.90;
        } else {
          dataMap[dateStr] = b.totalAmount * 0.90;
        }
      }
    });

    // Fallback if empty to ensure visual rhythm
    if (Object.values(dataMap).reduce((s, x) => s + x, 0) === 0) {
      return [
        { date: '07-01', earnings: 150000 },
        { date: '07-05', earnings: 280000 },
        { date: '07-10', earnings: 420000 },
        { date: '07-12', earnings: 610000 },
        { date: '07-14', earnings: netEarningsPayout || 850000 }
      ];
    }

    return Object.entries(dataMap)
      .map(([date, value]) => ({ date, earnings: value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      
      {/* 1. Gate Screen (Vendor Secure Login & Pre-seeds) */}
      <AnimatePresence mode="wait">
        {!activeVendor ? (
          <motion.div
            key="vendor-gate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-xl mx-auto mt-8"
            id="vendor-login-gate"
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
                <p className="text-white/90 font-normal text-[15px] sm:text-[16px] mt-3 leading-relaxed">
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
                        id="vendor-email-input"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAccessDashboard(vendorEmail)}
                    disabled={isLoading}
                    className="w-full bg-[#6C4CF1] text-white hover:bg-[#5B3ED6] h-[52px] rounded-xl text-[16px] font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#6C4CF1]/10 flex items-center justify-center space-x-2 cursor-pointer"
                    id="connect-vendor-btn"
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

                  <div className="grid grid-cols-2 gap-3" id="quick-fill-vendors-grid">
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
          
          /* 2. Main Professional Vendor Workspace Console */
          <motion.div
            key="vendor-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pb-16"
            id="vendor-dashboard-panel"
          >
            {/* Top Interactive Banner */}
            <div className="bg-white border border-neutral-100/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C4CF1]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              
              <div className="flex items-center space-x-6">
                <img
                  src={logoUrl}
                  alt={activeVendor.vendorName}
                  className="w-24 h-24 rounded-2xl object-cover border border-neutral-100 shadow-sm shrink-0 bg-neutral-50"
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
                      {avgRatingValue} / 5.0 Rating
                    </span>
                    <span className="text-xs text-neutral-300">|</span>
                    <span className="text-xs text-neutral-600 font-bold uppercase font-mono bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                      Pricing: {activeVendor.priceRange?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Availability Controller */}
              <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-100/70 md:w-80 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-[#F4B400]" />
                    Real-time Business Availability
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
                      className={`text-[10px] font-semibold py-2 px-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                        activeVendor.availabilityStatus === status
                          ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-xs font-bold'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Summary KPIs Widget Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4" id="vendor-kpi-grid">
              <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-2xs hover:border-[#6C4CF1]/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Total Bookings</span>
                  <div className="p-1.5 bg-neutral-50 rounded-lg text-neutral-600">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-black text-neutral-800">{totalBookingsCount}</h4>
                <p className="text-[9px] text-neutral-400 mt-1 font-light">Overall reservation volume</p>
              </div>

              <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-2xs hover:border-[#6C4CF1]/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Pending Requests</span>
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-black text-amber-600">{pendingRequestsCount}</h4>
                <p className="text-[9px] text-neutral-400 mt-1 font-light">Awaiting your approval</p>
              </div>

              <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-2xs hover:border-[#6C4CF1]/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Completed Jobs</span>
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-black text-emerald-600">{completedJobsCount}</h4>
                <p className="text-[9px] text-neutral-400 mt-1 font-light">Successfully fulfilled jobs</p>
              </div>

              <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-2xs hover:border-[#6C4CF1]/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Net Earnings (90%)</span>
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-[#6C4CF1]">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-black text-neutral-800">₦{netEarningsPayout.toLocaleString()}</h4>
                <p className="text-[9px] text-neutral-400 mt-1 font-light">Excluding 10% platform commission</p>
              </div>

              <div className="bg-[#6C4CF1] border border-[#6C4CF1] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/15 rounded-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-120" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-[10px] font-mono font-bold text-white/75 uppercase tracking-wider">Reputation Rating</span>
                  <div className="p-1.5 bg-white/10 rounded-lg text-white">
                    <Star className="w-3.5 h-3.5 fill-[#F4B400] text-[#F4B400]" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-black text-white relative z-10">{avgRatingValue} / 5.0</h4>
                <p className="text-[9px] text-white/80 mt-1 font-light relative z-10">Based on client comments</p>
              </div>
            </div>

            {/* Main Interactive Workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side Tab Icons Menu */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-neutral-100 rounded-2xl p-4.5 space-y-1 shadow-2xs">
                  <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3 font-mono">
                    WORKSPACE PORTALS
                  </span>

                  {[
                    { id: 'overview', name: 'Dashboard Overview', icon: LayoutDashboard },
                    { id: 'bookings', name: 'Booking Requests', icon: Calendar, badge: pendingRequestsCount, badgeColor: 'bg-rose-100 text-rose-600' },
                    { id: 'services', name: 'Our Services', icon: ClipboardCheck, badge: vendorServices.length, badgeColor: 'bg-neutral-100 text-neutral-600' },
                    { id: 'portfolio', name: 'Portfolio Gallery', icon: ImageIcon },
                    { id: 'reviews', name: 'Reputation & Reviews', icon: Star },
                    { id: 'earnings', name: 'Earnings & ledger', icon: DollarSign },
                    { id: 'profile', name: 'Business Profile', icon: Building },
                    { id: 'notifications', name: 'Notifications', icon: Bell, badge: unreadNotificationsCount, badgeColor: 'bg-[#6C4CF1] text-white' },
                    { id: 'settings', name: 'Vendor Settings', icon: Settings }
                  ].map((tabItem) => {
                    const TabIcon = tabItem.icon;
                    return (
                      <button
                        key={tabItem.id}
                        onClick={() => setDashboardTab(tabItem.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                          dashboardTab === tabItem.id
                            ? 'bg-[#6C4CF1] text-white shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <span className="flex items-center">
                          <TabIcon className="w-4 h-4 mr-2.5" />
                          {tabItem.name}
                        </span>
                        {tabItem.badge !== undefined && tabItem.badge > 0 && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            dashboardTab === tabItem.id ? 'bg-white text-[#6C4CF1]' : tabItem.badgeColor
                          }`}>
                            {tabItem.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Firestore Cloud Synchronizer card */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-5 border border-neutral-800 space-y-4">
                  <div className="flex items-center space-x-2 text-[#F4B400] text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>FIRESTORE ONLINE</span>
                  </div>
                  <p className="text-[11px] text-white/70 font-light leading-relaxed font-sans">
                    All operations are persistently written to the live Firestore database. Actions propagate instantly to the client's planner interface feed.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveVendor(null);
                        setBookings([]);
                        setVendorEmail('');
                        setDashboardTab('overview');
                        showNotification('Disconnected business account securely.');
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-colors border border-white/10 cursor-pointer text-center block"
                    >
                      Disconnect Console
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side Main Workspaces Panels */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  
                  {/* VIEW 1: DASHBOARD OVERVIEW */}
                  {dashboardTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-display font-bold text-lg text-neutral-800">Net Revenue Progress Tracker</h3>
                            <p className="text-xs text-neutral-400 font-light">Consolidated payouts over custom milestones</p>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-[#6C4CF1]" />
                        </div>
                        
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getEarningsTimelineData()} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6C4CF1" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#6C4CF1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
                              <Tooltip 
                                formatter={(value) => [`₦${value.toLocaleString()}`, 'Net Earnings']}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                              />
                              <Area type="monotone" dataKey="earnings" stroke="#6C4CF1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Mini pending bookings overview */}
                      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                          <div>
                            <h3 className="font-display font-bold text-neutral-800 text-base">Quick Action Feed</h3>
                            <p className="text-xs text-neutral-400 font-light">Urgent celebration tasks that require your input</p>
                          </div>
                          <button 
                            onClick={() => setDashboardTab('bookings')} 
                            className="text-xs text-[#6C4CF1] font-bold hover:underline flex items-center cursor-pointer"
                          >
                            <span>Manage all bookings</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        </div>

                        {pendingRequestsCount === 0 ? (
                          <div className="py-6 text-center text-neutral-400 text-xs italic">
                            No pending client requests waiting for confirmation. Everything is clear!
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookings.filter(b => b.bookingStatus === 'pending').slice(0, 2).map((booking) => (
                              <div key={booking.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-neutral-800 text-xs">{booking.userName}</h4>
                                  <p className="text-[10px] text-neutral-400">Date: {booking.bookingDate} &bull; Payout: <span className="font-bold text-[#6C4CF1]">₦{(booking.totalAmount * 0.90).toLocaleString()}</span></p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                    title="Decline"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBooking(booking.id!, 'confirmed')}
                                    className="px-3 py-1.5 bg-[#6C4CF1] text-white hover:bg-[#5b3ed9] rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Accept
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 2: BOOKINGS MANAGEMENT */}
                  {dashboardTab === 'bookings' && (
                    <motion.div
                      key="bookings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h2 className="font-display font-bold text-lg text-neutral-800">
                            Celebration Bookings Register
                          </h2>
                          <p className="text-xs text-neutral-500 font-light">
                            Audit scheduled gigs, accept inquiries, or process completions
                          </p>
                        </div>

                        {/* Booking filtering tabs */}
                        <div className="flex bg-neutral-100 p-1 rounded-xl text-xs font-bold uppercase tracking-wider" id="booking-status-tabs">
                          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filterOpt) => (
                            <button
                              key={filterOpt}
                              onClick={() => setBookingFilter(filterOpt)}
                              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] ${
                                bookingFilter === filterOpt
                                  ? 'bg-white text-[#6C4CF1] shadow-xs'
                                  : 'text-neutral-500 hover:text-neutral-800'
                              }`}
                            >
                              {filterOpt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {getFilteredBookings().length === 0 ? (
                        <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center space-y-3">
                          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto" />
                          <h4 className="font-bold text-sm text-neutral-800">No bookings found</h4>
                          <p className="text-xs text-neutral-400 max-w-sm mx-auto font-light leading-normal">
                            No celebration bookings match the selected status filter.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredBookings().map((booking) => (
                            <Card 
                              key={booking.id} 
                              className={`border bg-white transition-all duration-200 ${
                                booking.bookingStatus === 'pending' ? 'border-amber-200 shadow-sm shadow-amber-500/5' :
                                booking.bookingStatus === 'confirmed' ? 'border-indigo-100' :
                                'border-neutral-100'
                              }`}
                            >
                              <CardBody className="p-5 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-neutral-50">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] font-mono bg-neutral-100 px-2.5 py-0.5 rounded-full text-neutral-500 uppercase font-bold">
                                        INV-{booking.id?.toUpperCase().slice(0, 8)}
                                      </span>
                                      
                                      <span className={`text-[9px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        booking.bookingStatus === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        booking.bookingStatus === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                        booking.bookingStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        'bg-neutral-50 text-neutral-500 border border-neutral-100'
                                      }`}>
                                        {booking.bookingStatus}
                                      </span>
                                    </div>
                                    
                                    <h3 className="font-display font-bold text-base text-neutral-800 pt-1">
                                      {booking.userName || 'Celebration Customer'}
                                    </h3>
                                    <p className="text-xs text-neutral-400 font-light font-sans">
                                      Email: <span className="font-semibold text-neutral-600">{booking.userEmail}</span>
                                    </p>
                                  </div>

                                  <div className="text-left md:text-right shrink-0">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Gross Price</p>
                                    <p className="text-lg font-black text-[#6C4CF1] mt-1">
                                      ₦{booking.totalAmount.toLocaleString()}
                                    </p>
                                    <p className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                                      Net (90%): ₦{(booking.totalAmount * 0.90).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                                  <div className="flex items-center space-x-2.5">
                                    <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Event Date</p>
                                      <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                                        {booking.bookingDate}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2.5">
                                    <Sparkles className="w-4 h-4 text-neutral-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-mono font-bold text-[#6C4CF1] uppercase">Celebration ID</p>
                                      <p className="text-xs font-mono text-neutral-700 mt-0.5">
                                        {booking.birthdayPlanId.toUpperCase().slice(0, 10)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2.5">
                                    <DollarSign className="w-4 h-4 text-neutral-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Payment Invoice</p>
                                      <p className={`text-xs font-bold mt-0.5 ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                        {booking.paymentStatus.toUpperCase()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {booking.specialRequests && (
                                  <div className="bg-neutral-50/70 rounded-xl p-3 border border-neutral-100 text-xs">
                                    <p className="text-[9px] font-mono font-bold text-neutral-400 uppercase mb-1">Client Instructions / Special Demands</p>
                                    <p className="text-neutral-600 font-light leading-relaxed">
                                      "{booking.specialRequests}"
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                                  <div className="flex items-center space-x-4">
                                    <button
                                      onClick={() => setSelectedBookingDetails(booking)}
                                      className="text-xs text-neutral-500 hover:text-[#6C4CF1] font-bold flex items-center cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      <span>Detailed Specifications</span>
                                    </button>

                                    <button
                                      onClick={() => setChatBooking(booking)}
                                      className="text-xs text-neutral-500 hover:text-[#6C4CF1] font-bold flex items-center cursor-pointer"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1 text-[#6C4CF1]" />
                                      <span>Chat with Client</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {booking.bookingStatus === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                          disabled={isActionLoading === booking.id}
                                          className="px-4 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                          Decline Inquiry
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'accepted')}
                                          disabled={isActionLoading === booking.id}
                                          className="bg-[#6C4CF1] hover:bg-[#5B3ED6] text-white px-5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs flex items-center cursor-pointer"
                                        >
                                          {isActionLoading === booking.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                          Accept Inquiry
                                        </button>
                                      </>
                                    )}

                                    {(booking.bookingStatus === 'accepted' || booking.bookingStatus === 'confirmed') && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                          disabled={isActionLoading === booking.id}
                                          className="px-3 py-1.5 text-neutral-400 hover:text-rose-500 rounded-xl text-xs font-bold cursor-pointer"
                                        >
                                          Cancel GIG
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'in_progress')}
                                          disabled={isActionLoading === booking.id}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs flex items-center cursor-pointer"
                                        >
                                          {isActionLoading === booking.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                          Start Curation
                                        </button>
                                      </>
                                    )}

                                    {booking.bookingStatus === 'in_progress' && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'cancelled')}
                                          disabled={isActionLoading === booking.id}
                                          className="px-3 py-1.5 text-neutral-400 hover:text-rose-500 rounded-xl text-xs font-bold cursor-pointer"
                                        >
                                          Cancel GIG
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBooking(booking.id!, 'completed')}
                                          disabled={isActionLoading === booking.id}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs flex items-center cursor-pointer"
                                        >
                                          {isActionLoading === booking.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                          Fulfill Service
                                        </button>
                                      </>
                                    )}

                                    {booking.bookingStatus === 'completed' && (
                                      <div className="flex items-center space-x-1 text-emerald-600 text-xs font-extrabold uppercase font-mono">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Fulfillled</span>
                                      </div>
                                    )}

                                    {booking.bookingStatus === 'cancelled' && (
                                      <span className="text-neutral-400 text-xs font-bold uppercase font-mono">Inactive / Cancelled</span>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* VIEW 3: SERVICES MANAGEMENT (CRUD) */}
                  {dashboardTab === 'services' && (
                    <motion.div
                      key="services"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display font-bold text-lg text-neutral-800">
                            Service Offerings & Pricing Catalog
                          </h2>
                          <p className="text-xs text-neutral-500 font-light">
                            Add, edit, or remove services offered under your celebration profile
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingServiceId(null);
                            setServiceForm({ name: '', price: 0, description: '', available: true });
                            setIsAddingService(!isAddingService);
                          }}
                          className="flex items-center space-x-1.5 bg-[#6C4CF1] hover:bg-[#5b3ed9] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                          id="add-new-service-btn"
                        >
                          {isAddingService ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                          <span>{isAddingService ? 'Collapse Panel' : 'Add New Service'}</span>
                        </button>
                      </div>

                      {/* Add/Edit Form Panel */}
                      {isAddingService && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4"
                        >
                          <h3 className="font-display font-bold text-sm text-neutral-800">
                            {editingServiceId ? 'Modify Service Offering' : 'Register New Service Offering'}
                          </h3>
                          
                          <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Service Name</label>
                              <input
                                type="text"
                                value={serviceForm.name}
                                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                placeholder="e.g. 3-Tier Luxury Custom Velvet Fondant Cake"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-2.5 transition-all focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Pricing (₦ NGN)</label>
                              <input
                                type="number"
                                value={serviceForm.price || ''}
                                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                                placeholder="Price in Naira"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-2.5 transition-all focus:outline-none font-bold"
                                required
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Description & Package Inclusions</label>
                              <textarea
                                value={serviceForm.description}
                                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                placeholder="Detail what is included (e.g., flavors, setup materials, delivery, hours of attendance, custom decorations...)"
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-2.5 transition-all focus:outline-none h-20 resize-none"
                                required
                              />
                            </div>

                            <div className="md:col-span-3 flex items-center justify-between pt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="serviceAvailable"
                                  checked={serviceForm.available}
                                  onChange={(e) => setServiceForm({ ...serviceForm, available: e.target.checked })}
                                  className="w-4 h-4 rounded text-[#6C4CF1] focus:ring-[#6C4CF1] cursor-pointer"
                                />
                                <label htmlFor="serviceAvailable" className="text-xs text-neutral-600 font-bold cursor-pointer">
                                  Mark immediately available for client booking selections
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setIsAddingService(false)}
                                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold uppercase cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="bg-[#6C4CF1] text-white hover:bg-[#5b3ed9] px-5 py-2 rounded-xl font-bold uppercase shadow-xs cursor-pointer"
                                >
                                  {editingServiceId ? 'Update Service' : 'Save Service'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </motion.div>
                      )}

                      {/* Services Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {vendorServices.map((service) => (
                          <div 
                            key={service.id} 
                            className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all relative flex flex-col justify-between ${
                              service.available ? 'border-neutral-100 hover:border-[#6C4CF1]/20' : 'border-neutral-200 opacity-70 bg-neutral-50/50'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  service.available ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                  {service.available ? 'Available' : 'Unavailable'}
                                </span>
                                <span className="font-mono font-extrabold text-neutral-800 text-sm">
                                  ₦{(service.price || 0).toLocaleString()}
                                </span>
                              </div>

                              <h4 className="font-bold text-neutral-800 text-sm">{service.name}</h4>
                              <p className="text-xs text-neutral-500 font-light leading-relaxed line-clamp-3">
                                {service.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-50 pt-3 mt-4 text-xs font-bold">
                              <button
                                onClick={() => handleToggleServiceAvailability(service.id)}
                                className="text-[#6C4CF1] hover:underline cursor-pointer"
                              >
                                Toggle availability
                              </button>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingServiceId(service.id);
                                    setServiceForm({
                                      name: service.name,
                                      price: service.price,
                                      description: service.description,
                                      available: service.available
                                    });
                                    setIsAddingService(true);
                                  }}
                                  className="p-1 text-neutral-500 hover:text-[#6C4CF1] cursor-pointer"
                                >
                                  <Edit className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteService(service.id)}
                                  className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 4: PORTFOLIO GALLERY */}
                  {dashboardTab === 'portfolio' && (
                    <motion.div
                      key="portfolio"
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
                          Configure your custom snapshot slides. Add descriptions, cover status, or move order.
                        </p>
                      </div>

                      <Card className="border border-neutral-100 bg-white shadow-xs">
                        <CardBody className="p-6 space-y-4">
                          <h3 className="font-display font-bold text-sm text-neutral-800">Add New Portfolio Image</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="flex flex-col justify-center space-y-3 bg-neutral-50/50 rounded-2xl p-6 border border-neutral-100">
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
                                className="w-full bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
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
                        {activeVendor.images?.map((imgUrl: string, index: number) => (
                          <div 
                            key={index}
                            className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-2xs relative group flex flex-col"
                          >
                            <img
                              src={imgUrl}
                              alt={`Portfolio Asset ${index + 1}`}
                              className="w-full h-40 object-cover group-hover:scale-102 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Actions Overlay */}
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveImage(index, 'left')}
                                disabled={index === 0}
                                className="p-1.5 bg-white/90 hover:bg-white text-neutral-700 rounded-md shadow-xs text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                title="Move Left"
                              >
                                &larr;
                              </button>
                              <button
                                onClick={() => handleMoveImage(index, 'right')}
                                disabled={index === (activeVendor.images?.length || 0) - 1}
                                className="p-1.5 bg-white/90 hover:bg-white text-neutral-700 rounded-md shadow-xs text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                title="Move Right"
                              >
                                &rarr;
                              </button>
                              <button
                                onClick={() => handleRemovePortfolioImage(index)}
                                className="p-1.5 bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 rounded-md shadow-xs cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {index === 0 && (
                              <span className="absolute top-3 left-3 bg-[#6C4CF1] text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider shadow-sm">
                                Cover Photo
                              </span>
                            )}

                            {/* Caption Editing Panel */}
                            <div className="p-3 bg-white border-t border-neutral-50 flex-1">
                              <input
                                type="text"
                                placeholder="Add caption/title for this photo..."
                                value={portfolioCaptions[index] || ''}
                                onChange={(e) => handleUpdateCaption(index, e.target.value)}
                                className="w-full text-[11px] bg-neutral-50 border border-neutral-100 rounded-lg px-2 py-1 transition-all focus:outline-none focus:bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 5: REVIEWS AND REPUTATION */}
                  {dashboardTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Rating Card */}
                        <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs flex flex-col justify-center items-center text-center">
                          <h4 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Aggregate Score</h4>
                          <h1 className="font-display font-black text-5xl text-neutral-800 mt-2">{avgRatingValue}</h1>
                          
                          <div className="flex space-x-1.5 mt-2.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={`w-5 h-5 ${
                                  s <= Math.round(Number(avgRatingValue)) ? 'fill-[#F4B400] text-[#F4B400]' : 'text-neutral-200'
                                }`} 
                              />
                            ))}
                          </div>
                          
                          <p className="text-xs text-neutral-400 mt-3 font-light">Based on {reviews.length} authentic customer reviews</p>
                        </div>

                        {/* Rating Bars Card */}
                        <div className="md:col-span-2 bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-3 flex flex-col justify-center">
                          <h4 className="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-50">Reputation distribution</h4>
                          
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center text-xs text-neutral-600">
                                <span className="w-12 font-bold">{star} Star</span>
                                <div className="flex-1 bg-neutral-100 h-2.5 rounded-full mx-3 overflow-hidden">
                                  <div className="bg-[#F4B400] h-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-right font-bold text-neutral-400 font-mono">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Client Comments Feed */}
                      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                        <h3 className="font-display font-bold text-base text-neutral-800">Client Reviews Log</h3>
                        
                        <div className="divide-y divide-neutral-50">
                          {reviews.map((r) => (
                            <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-neutral-800">{r.userName}</span>
                                <span className="text-neutral-400 font-mono text-[10px]">{r.date}</span>
                              </div>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`w-3.5 h-3.5 ${
                                      star <= r.rating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-neutral-200'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <p className="text-neutral-500 font-light leading-relaxed">
                                "{r.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 6: EARNINGS HUB AND LEDGER */}
                  {dashboardTab === 'earnings' && (
                    <motion.div
                      key="earnings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Detailed Fee splits info card */}
                      <div className="bg-neutral-900 border border-neutral-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#6C4CF1]/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
                          <div>
                            <h3 className="font-display font-extrabold text-xl">Commercial Disbursement ledger</h3>
                            <p className="text-xs text-white/60 font-light mt-0.5">MyDay commission cut (10%) and net vendor disbursements (90%)</p>
                          </div>
                          
                          <button
                            onClick={handleExportEarningsCSV}
                            className="flex items-center justify-center space-x-1.5 px-4.5 py-2.5 bg-[#6C4CF1] hover:bg-[#5b3ed9] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export Earnings statement</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 relative z-10">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">Gross platform Billing</span>
                            <h2 className="text-2xl font-black font-sans">₦{grossEarnings.toLocaleString()}</h2>
                            <p className="text-[10px] text-neutral-400 font-light">Calculated from confirmed and finished jobs</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-rose-400 uppercase tracking-wider">Platform commission (10%)</span>
                            <h2 className="text-2xl font-black text-rose-400 font-sans">₦{platformFee.toLocaleString()}</h2>
                            <p className="text-[10px] text-neutral-400 font-light">MyDay administrative slice</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Net Vendor Payout (90%)</span>
                            <h2 className="text-2xl font-black text-emerald-400 font-sans">₦{netEarningsPayout.toLocaleString()}</h2>
                            <p className="text-[10px] text-neutral-400 font-light">Directly paid into your bank credentials</p>
                          </div>
                        </div>
                      </div>

                      {/* Milestone bar */}
                      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                        <div>
                          <h3 className="font-display font-bold text-neutral-800 text-sm">Monthly Revenue Milestone Progress</h3>
                          <p className="text-xs text-neutral-400 font-light mt-0.5">Your progress toward the ₦1,500,000 top-tier partner tier</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-[#6C4CF1] h-full transition-all" style={{ width: `${Math.min(100, (netEarningsPayout / 1500000) * 100)}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400">
                            <span>₦0</span>
                            <span className="text-[#6C4CF1]">₦{(netEarningsPayout).toLocaleString()} Earned</span>
                            <span>₦1,500,000 Milestone Goal</span>
                          </div>
                        </div>
                      </div>

                      {/* Earnings Ledger Table */}
                      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                        <h3 className="font-display font-bold text-neutral-800 text-base">Invoices Ledger log</h3>
                        
                        <div className="overflow-x-auto rounded-xl border border-neutral-100">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[9px] border-b border-neutral-100">
                                <th className="p-3.5">Reference ID</th>
                                <th className="p-3.5">Client Full Name</th>
                                <th className="p-3.5">Scheduled Date</th>
                                <th className="p-3.5 text-right">Gross Total</th>
                                <th className="p-3.5 text-right">Platform cut (10%)</th>
                                <th className="p-3.5 text-right">Net Payout (90%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50 text-neutral-600 font-medium">
                              {bookings.map((tx) => {
                                const gross = tx.totalAmount || 0;
                                const comm = gross * 0.10;
                                const payout = gross * 0.90;
                                return (
                                  <tr key={tx.id} className="hover:bg-neutral-50/50">
                                    <td className="p-3 font-mono font-bold text-[#6C4CF1]">MYD-{tx.id?.slice(0, 8).toUpperCase() || 'TX'}</td>
                                    <td className="p-3 text-neutral-800 font-semibold">{tx.userName || 'Premium Client'}</td>
                                    <td className="p-3 text-neutral-400 font-light">{tx.bookingDate}</td>
                                    <td className="p-3 text-right font-mono font-bold">₦{gross.toLocaleString()}</td>
                                    <td className="p-3 text-right text-rose-500 font-mono">₦{comm.toLocaleString()}</td>
                                    <td className="p-3 text-right text-emerald-600 font-mono font-extrabold">₦{payout.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 7: BUSINESS PROFILE CONFIGURATION */}
                  {dashboardTab === 'profile' && (
                    <motion.div
                      key="profile"
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
                          Configure your business address, brand logo picture, business hours, and operational areas in Kwara State.
                        </p>
                      </div>

                      <Card className="border border-neutral-100 bg-white">
                        <CardBody className="p-6">
                          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-medium">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Commercial Vendor Name
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.vendorName}
                                  onChange={(e) => setProfileForm({ ...profileForm, vendorName: e.target.value })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none text-neutral-800 font-bold text-xs"
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
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none text-neutral-800 text-xs"
                                  placeholder="+234 803 123 4567"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Brand Logo Picture (URL)
                                </label>
                                <input
                                  type="text"
                                  value={logoUrl}
                                  onChange={(e) => setLogoUrl(e.target.value)}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none text-neutral-800 text-xs"
                                  placeholder="Logo Link address"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Price Range classification
                                </label>
                                <select
                                  value={profileForm.priceRange}
                                  onChange={(e) => setProfileForm({ ...profileForm, priceRange: e.target.value as DBVendor['priceRange'] })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none text-neutral-700 text-xs font-bold"
                                >
                                  <option value="low">Low (₦ - Budget Friendly)</option>
                                  <option value="medium">Medium (₦₦ - Fair Pricing)</option>
                                  <option value="high">High (₦₦₦ - Premium / Upscale)</option>
                                  <option value="luxury">Luxury (₦₦₦₦ - Exclusive Luxury)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                  Primary Location address
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.location}
                                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none text-neutral-800 text-xs font-semibold"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Business Hours Configuration</label>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[8px] uppercase text-neutral-400 font-bold">Mon-Fri</label>
                                    <input
                                      type="text"
                                      value={businessHours.mondayFriday}
                                      onChange={(e) => setBusinessHours({ ...businessHours, mondayFriday: e.target.value })}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 focus:outline-none text-[10px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] uppercase text-neutral-400 font-bold">Saturday</label>
                                    <input
                                      type="text"
                                      value={businessHours.saturday}
                                      onChange={(e) => setBusinessHours({ ...businessHours, saturday: e.target.value })}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 focus:outline-none text-[10px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] uppercase text-neutral-400 font-bold">Sunday</label>
                                    <input
                                      type="text"
                                      value={businessHours.sunday}
                                      onChange={(e) => setBusinessHours({ ...businessHours, sunday: e.target.value })}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 focus:outline-none text-[10px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Service Areas */}
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                Target Service Areas (LGAs in Kwara State)
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                {KWARA_AREAS.map((area) => {
                                  const isSelected = serviceAreas.includes(area);
                                  return (
                                    <button
                                      type="button"
                                      key={area}
                                      onClick={() => {
                                        if (isSelected) {
                                          setServiceAreas(serviceAreas.filter(a => a !== area));
                                        } else {
                                          setServiceAreas([...serviceAreas, area]);
                                        }
                                      }}
                                      className={`p-2 rounded-lg border text-center transition-all text-[10px] font-bold cursor-pointer ${
                                        isSelected 
                                          ? 'bg-[#6C4CF1] border-[#6C4CF1] text-white shadow-xs'
                                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                      }`}
                                    >
                                      {area}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                Biography & Service Description
                              </label>
                              <textarea
                                value={profileForm.description}
                                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#6C4CF1] focus:bg-white rounded-xl px-3.5 py-3 transition-all focus:outline-none h-24 resize-none leading-relaxed text-neutral-700 text-xs font-normal"
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

                  {/* VIEW 8: NOTIFICATION CENTER */}
                  {dashboardTab === 'notifications' && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display font-bold text-lg text-neutral-800">
                            Partner Alerts Console
                          </h2>
                          <p className="text-xs text-neutral-500 font-light">
                            Manage real-time notifications, celebration orders, and ledger disbursements
                          </p>
                        </div>

                        {notifications.length > 0 && (
                          <div className="flex items-center space-x-2 text-xs font-bold">
                            <button
                              onClick={handleMarkAllNotificationsRead}
                              className="text-[#6C4CF1] hover:underline cursor-pointer"
                            >
                              Mark all as read
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              onClick={handleClearNotifications}
                              className="text-neutral-500 hover:text-rose-500 cursor-pointer"
                            >
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center space-y-3">
                          <Bell className="w-10 h-10 text-neutral-300 mx-auto" />
                          <h4 className="font-bold text-sm text-neutral-800">Notification cache clear</h4>
                          <p className="text-xs text-neutral-400 max-w-sm mx-auto font-light leading-normal">
                            No active alerts found. We will notify you when clients make reservations.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                                notif.read 
                                  ? 'bg-white border-neutral-100 opacity-80' 
                                  : 'bg-[#6C4CF1]/5 border-[#6C4CF1]/10 font-semibold'
                              }`}
                            >
                              <div className="flex space-x-3 text-xs">
                                <div className={`p-2 rounded-xl mt-0.5 ${notif.read ? 'bg-neutral-100 text-neutral-500' : 'bg-[#6C4CF1]/10 text-[#6C4CF1]'}`}>
                                  <Bell className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-neutral-800">{notif.title}</h4>
                                  <p className="text-neutral-500 font-light leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDismissNotification(notif.id)}
                                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* VIEW 9: SETTINGS PANEL */}
                  {dashboardTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="font-display font-bold text-lg text-neutral-800">
                          Vendor Dashboard Settings
                        </h2>
                        <p className="text-xs text-neutral-500 font-light">
                          Configure alert modes, security preferences, and dashboard themes
                        </p>
                      </div>

                      <Card className="border border-neutral-100 bg-white shadow-2xs">
                        <CardBody className="p-6 space-y-6 text-xs">
                          
                          {/* Alert toggles */}
                          <div className="space-y-4">
                            <h3 className="font-display font-bold text-sm text-neutral-800 pb-2 border-b border-neutral-50 flex items-center">
                              <Sliders className="w-4.5 h-4.5 mr-2 text-[#6C4CF1]" />
                              Communications & Alerts
                            </h3>

                            <div className="space-y-3 font-semibold text-neutral-700">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-neutral-800">Email Alerts on Reservations</p>
                                  <p className="text-[11px] text-neutral-400 font-light">Receive real-time invoices when users book your services</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settingsForm.emailAlerts}
                                  onChange={(e) => handleSaveSettings({ ...settingsForm, emailAlerts: e.target.checked })}
                                  className="w-4 h-4 text-[#6C4CF1] focus:ring-[#6C4CF1] cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-neutral-800">SMS Verification Prompts</p>
                                  <p className="text-[11px] text-neutral-400 font-light">Verify and settle booking requests over Nigerian mobile numbers</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={settingsForm.smsAlerts}
                                  onChange={(e) => handleSaveSettings({ ...settingsForm, smsAlerts: e.target.checked })}
                                  className="w-4 h-4 text-[#6C4CF1] focus:ring-[#6C4CF1] cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Holiday mode */}
                          <div className="space-y-4">
                            <h3 className="font-display font-bold text-sm text-neutral-800 pb-2 border-b border-neutral-50 flex items-center">
                              <Clock className="w-4.5 h-4.5 mr-2 text-amber-500" />
                              Holiday / Maintenance Mode
                            </h3>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-neutral-800">Activate Holiday Mode ("On Break")</p>
                                <p className="text-[11px] text-neutral-400 font-light">Sets your availability status to "On Break" and temporarily hides you from planning pages</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settingsForm.holidayMode}
                                onChange={(e) => handleSaveSettings({ ...settingsForm, holidayMode: e.target.checked })}
                                className="w-4 h-4 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Account Security Info */}
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1 text-amber-800">
                              <h4 className="font-bold">Partner Account Security Notice</h4>
                              <p className="font-light leading-relaxed">
                                Curated accounts represent legal creative partners of MyDay. Modification of core credentials, email changes, or deletions require verification. Contact support@myday.com for credential overrides.
                              </p>
                            </div>
                          </div>

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

      {/* DETAILED BOOKING SPECIFICATIONS MODAL */}
      <AnimatePresence>
        {selectedBookingDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedBookingDetails(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-neutral-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Store className="w-5 h-5 text-[#F4B400]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-300">Reservation Details</span>
                </div>
                <button 
                  onClick={() => setSelectedBookingDetails(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-neutral-700">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-50">
                  <div>
                    <h3 className="text-base font-bold text-neutral-800">{selectedBookingDetails.userName}</h3>
                    <p className="text-xs text-neutral-400">{selectedBookingDetails.userEmail}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                    selectedBookingDetails.bookingStatus === 'pending' ? 'bg-amber-50 text-amber-600' :
                    selectedBookingDetails.bookingStatus === 'confirmed' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {selectedBookingDetails.bookingStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Scheduled Date</span>
                    <p className="text-xs font-semibold mt-0.5 text-neutral-800">{selectedBookingDetails.bookingDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Naira Payout (90%)</span>
                    <p className="text-xs font-black mt-0.5 text-[#6C4CF1]">₦{(selectedBookingDetails.totalAmount * 0.90).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Payment Status</span>
                    <p className="text-xs font-bold mt-0.5 text-neutral-800">{selectedBookingDetails.paymentStatus.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Plan Reference Code</span>
                    <p className="text-xs font-mono mt-0.5 text-neutral-800">{selectedBookingDetails.birthdayPlanId.toUpperCase()}</p>
                  </div>
                </div>

                {selectedBookingDetails.specialRequests && (
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-1.5">
                    <span className="text-[9px] font-bold uppercase text-neutral-400">Detailed Instructions</span>
                    <p className="text-neutral-600 font-light leading-relaxed">
                      "{selectedBookingDetails.specialRequests}"
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-50 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setSelectedBookingDetails(null)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl cursor-pointer"
                  >
                    Close Specifications
                  </button>
                  
                  {selectedBookingDetails.bookingStatus === 'pending' && (
                    <button
                      onClick={() => {
                        handleUpdateBooking(selectedBookingDetails.id!, 'confirmed');
                      }}
                      className="px-5 py-2 bg-[#6C4CF1] hover:bg-[#5b3ed9] text-white rounded-xl cursor-pointer"
                    >
                      Accept Inquiry
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Collaboration Suite chat modal */}
      <AnimatePresence>
        {chatBooking && (
          <BookingChatModal
            isOpen={!!chatBooking}
            onClose={() => setChatBooking(null)}
            bookingId={chatBooking.id || ''}
            bookingTitle={`Workspace with client ${chatBooking.userName || 'Patron'}`}
            currentUser={{
              uid: activeVendor?.id || 'vendor-partner',
              displayName: activeVendor?.name || 'Vendor Partner',
              email: activeVendor?.email || 'vendor@myday.com'
            }}
            currentRole="vendor"
          />
        )}
      </AnimatePresence>

    </div>
  );
};
