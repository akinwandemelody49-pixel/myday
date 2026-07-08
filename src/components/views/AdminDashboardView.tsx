import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, TrendingUp, Users, Store, Briefcase, 
  CheckCircle2, XCircle, Trash2, Settings, Layers, DollarSign, 
  AlertCircle, Calendar, ArrowUpRight, PieChart, Bell, FileText, 
  Filter, Check, Loader2, ShieldCheck, Mail, Phone, ExternalLink, RefreshCw, ChevronRight, MessageSquare,
  Download, FileSpreadsheet, Target
} from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  DBUserProfile, DBBooking, DBVendor, OperationType, handleFirestoreError, 
  DBSystemActivityLog, logSystemActivity, getSystemActivityLogs 
} from '../../services/db_services';
import { VendorApplication } from '../../types';
import { getVendorApplicationsFromFirestore, saveVendorApplicationToFirestore } from '../../services/db';
import { D3RevenueLineChart } from '../ui/D3RevenueLineChart';
import { D3RevenueGauge } from '../ui/D3RevenueGauge';

export interface ApprovalHistoryLog {
  id: string;
  applicationId: string;
  businessName: string;
  ownerName: string;
  category: string;
  action: 'Approved' | 'Rejected';
  adminName: string;
  adminEmail: string;
  timestamp: string;
}

interface AdminDashboardViewProps {
  user: any;
  showNotification: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  showNotification,
  onNavigateTab
}) => {
  // Navigation & UI Tabs inside Admin Dashboard: 'overview' | 'applications' | 'users' | 'vendors' | 'bookings' | 'settings' | 'history' | 'logs'
  const [adminTab, setAdminTab] = useState<'overview' | 'applications' | 'users' | 'vendors' | 'bookings' | 'settings' | 'history' | 'logs'>('overview');
  
  // Data State fetched from Firestore
  const [users, setUsers] = useState<DBUserProfile[]>([]);
  const [vendors, setVendors] = useState<DBVendor[]>([]);
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<DBSystemActivityLog[]>([]);
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  
  // Modals / Confirmations
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [userToDelete, setUserToDelete] = useState<DBUserProfile | null>(null);
  
  // Filters
  const [appFilter, setAppFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Real-time Export Toast state
  const [exportToasts, setExportToasts] = useState<{
    id: string;
    title: string;
    message: string;
    fileName: string;
    timestamp: Date;
    progress: number;
    completed: boolean;
  }[]>([]);

  // Helper to escape CSV values safely to prevent layout corruption with commas and quotes
  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const stringVal = String(val);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const handleExportUsersCSV = async () => {
    if (users.length === 0) {
      showNotification('No user profiles available to export.');
      return;
    }
    try {
      const headers = ['User ID', 'Full Name', 'Email Address', 'Role', 'City', 'Preferred Style', 'Average Budget (₦)', 'Registered At', 'Last Updated'];
      const rows = users.map(u => [
        u.uid || u.id || '',
        u.fullName || '',
        u.email || '',
        u.role || 'customer',
        u.city || '',
        u.preferredStyle || '',
        u.averageBudget || 0,
        u.createdAt ? new Date(u.createdAt).toISOString() : '',
        u.updatedAt ? new Date(u.updatedAt).toISOString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(escapeCSV).join(','))
      ].join('\n');

      const fileName = `MyDay_User_Audit_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Trigger standard toast notification
      showNotification('User Directory CSV compiled. Download has started!');

      // Register custom real-time toast tracker
      const toastId = `toast_${Date.now()}`;
      const newToast = {
        id: toastId,
        title: 'User Export Download Started',
        message: 'The requested User Directory file is compiling and the file transfer has initiated.',
        fileName,
        timestamp: new Date(),
        progress: 100,
        completed: true
      };
      setExportToasts(prev => [...prev, newToast]);

      // Write System Activity Log
      try {
        const sysLog = {
          type: 'csv_export' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Exported User Directory Ledger to CSV (${users.length} profiles)`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write user CSV export system log', logErr);
      }

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setExportToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);

    } catch (err) {
      console.error('CSV Export Error:', err);
      showNotification('Failed to export user database.');
    }
  };

  const handleExportVendorsCSV = async () => {
    if (vendors.length === 0) {
      showNotification('No active vendors available to export.');
      return;
    }
    try {
      const headers = ['Vendor ID', 'Business Name', 'Category', 'Description', 'Location', 'Rating', 'Price Tier', 'Availability', 'Phone', 'Email', 'Verified Status'];
      const rows = vendors.map(v => [
        v.id || '',
        v.vendorName || '',
        v.category || '',
        v.description || '',
        v.location || '',
        v.rating || 0,
        v.priceRange || 'medium',
        v.availabilityStatus || 'Available',
        v.phone || '',
        v.email || '',
        v.verified ? 'Verified' : 'Unverified'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(escapeCSV).join(','))
      ].join('\n');

      const fileName = `MyDay_Active_Artisans_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Trigger standard toast notification
      showNotification('Artisan Directory CSV compiled. Download has started!');

      // Register custom real-time toast tracker
      const toastId = `toast_${Date.now()}`;
      const newToast = {
        id: toastId,
        title: 'Artisans Export Download Started',
        message: 'The requested Artisan Directory file is compiling and the file transfer has initiated.',
        fileName,
        timestamp: new Date(),
        progress: 100,
        completed: true
      };
      setExportToasts(prev => [...prev, newToast]);

      // Write System Activity Log
      try {
        const sysLog = {
          type: 'csv_export' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Exported Artisan Directory Ledger to CSV (${vendors.length} vendors)`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write vendor CSV export system log', logErr);
      }

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setExportToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);

    } catch (err) {
      console.error('CSV Export Error:', err);
      showNotification('Failed to export vendors database.');
    }
  };

  // Fetch all administrative data collections from Firestore
  const fetchAllAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers: DBUserProfile[] = [];
      usersSnap.forEach((d) => {
        fetchedUsers.push({ id: d.id, ...d.data() } as any);
      });
      setUsers(fetchedUsers);

      // 2. Fetch Vendors
      const vendorsSnap = await getDocs(collection(db, 'vendors'));
      const fetchedVendors: DBVendor[] = [];
      vendorsSnap.forEach((d) => {
        fetchedVendors.push({ id: d.id, ...d.data() } as any);
      });
      setVendors(fetchedVendors);

      // 3. Fetch Bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const fetchedBookings: DBBooking[] = [];
      bookingsSnap.forEach((d) => {
        fetchedBookings.push({ id: d.id, ...d.data() } as any);
      });
      setBookings(fetchedBookings);

      // 4. Fetch Vendor Applications
      const apps = await getVendorApplicationsFromFirestore();
      setApplications(apps);

      // 5. Fetch Approval History
      const historySnap = await getDocs(collection(db, 'approvalHistory'));
      const fetchedHistory: ApprovalHistoryLog[] = [];
      historySnap.forEach((d) => {
        fetchedHistory.push({ id: d.id, ...d.data() } as any);
      });
      fetchedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setApprovalHistory(fetchedHistory);

      // 6. Fetch System Activity Logs
      try {
        const fetchedLogs = await getSystemActivityLogs();
        setActivityLogs(fetchedLogs);
      } catch (logErr) {
        console.error('Failed to load system activity logs', logErr);
      }

    } catch (err) {
      console.error('Error loading admin dashboard records', err);
      showNotification('Failed to fetch the latest platform records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Approve a Vendor Application
  const handleApproveApplication = async (app: VendorApplication) => {
    setIsActionLoading(app.applicationId);
    try {
      // 1. Update application status in Firestore
      const updatedApp: VendorApplication = {
        ...app,
        status: 'Approved'
      };
      await saveVendorApplicationToFirestore(updatedApp);
      
      // 2. Generate and write vendor profile record into /vendors/ collection
      const newVendorId = app.applicationId; // align vendor ID with application ID
      const newVendor: DBVendor = {
        id: newVendorId,
        vendorName: app.businessName,
        category: (app.category as any) || 'Venues',
        description: app.description || 'Verified premium event curator on MyDay.',
        location: `${app.city}, ${app.state}`,
        images: app.portfolioImages && app.portfolioImages.length > 0 
          ? app.portfolioImages 
          : ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400'],
        phone: app.phone,
        email: app.email,
        rating: 5.0,
        priceRange: 'medium',
        verified: true,
        availabilityStatus: 'Available'
      };
      
      const vendorRef = doc(db, 'vendors', newVendorId);
      await setDoc(vendorRef, newVendor);

      // 3. Upgrade user role in /users/ if their email exists
      const userToUpgrade = users.find(u => u.email?.toLowerCase() === app.email.toLowerCase());
      if (userToUpgrade && userToUpgrade.uid) {
        const userRef = doc(db, 'users', userToUpgrade.uid);
        await updateDoc(userRef, { role: 'vendor' });
        
        // Update local state instantly
        setUsers(prev => prev.map(u => u.uid === userToUpgrade.uid ? { ...u, role: 'vendor' } : u));
      }

      // Sync local state
      setApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updatedApp : a));
      setVendors(prev => [...prev.filter(v => v.id !== newVendorId), newVendor]);
      
      // 4. Log the approval in approvalHistory collection
      const logId = `log_${Date.now()}_${app.applicationId}`;
      const logData: ApprovalHistoryLog = {
        id: logId,
        applicationId: app.applicationId,
        businessName: app.businessName,
        ownerName: app.ownerName,
        category: app.category || 'N/A',
        action: 'Approved',
        adminName: user?.displayName || user?.email || 'Admin',
        adminEmail: user?.email || 'admin@myday.com',
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'approvalHistory', logId), logData);
      setApprovalHistory(prev => [logData, ...prev]);

      // Write System Activity Log
      try {
        const sysLog = {
          type: 'vendor_approved' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Approved vendor application for "${app.businessName}" (${app.category}) owned by ${app.ownerName}`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write approval system log', logErr);
      }

      showNotification(`Successfully approved "${app.businessName}"! Vendor profile activated.`);
      setSelectedApp(null);
    } catch (e) {
      console.error('Failed to approve application', e);
      showNotification('An error occurred during verification.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Reject a Vendor Application
  const handleRejectApplication = async (app: VendorApplication) => {
    setIsActionLoading(app.applicationId);
    try {
      const updatedApp: VendorApplication = {
        ...app,
        status: 'Rejected'
      };
      await saveVendorApplicationToFirestore(updatedApp);
      
      // Log the rejection in approvalHistory collection
      const logId = `log_${Date.now()}_${app.applicationId}`;
      const logData: ApprovalHistoryLog = {
        id: logId,
        applicationId: app.applicationId,
        businessName: app.businessName,
        ownerName: app.ownerName,
        category: app.category || 'N/A',
        action: 'Rejected',
        adminName: user?.displayName || user?.email || 'Admin',
        adminEmail: user?.email || 'admin@myday.com',
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'approvalHistory', logId), logData);
      setApprovalHistory(prev => [logData, ...prev]);

      // Write System Activity Log
      try {
        const sysLog = {
          type: 'vendor_rejected' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Rejected vendor application for "${app.businessName}" (${app.category}) owned by ${app.ownerName}`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write rejection system log', logErr);
      }

      setApplications(prev => prev.map(a => a.applicationId === app.applicationId ? updatedApp : a));
      showNotification(`Vendor application for "${app.businessName}" has been declined.`);
      setSelectedApp(null);
    } catch (e) {
      console.error('Failed to reject application', e);
      showNotification('An error occurred while rejecting application.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Change User Role directly
  const handleChangeUserRole = async (uid: string, newRole: 'customer' | 'vendor' | 'admin') => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      
      const affectedUser = users.find(u => u.uid === uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      
      // Write System Activity Log
      try {
        const sysLog = {
          type: 'user_role_update' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Updated role for user "${affectedUser?.fullName || 'Anonymous'}" (${affectedUser?.email || ''}) to "${newRole}"`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write user role update system log', logErr);
      }

      showNotification(`Successfully updated user role to "${newRole}".`);
    } catch (e) {
      console.error('Error updating user role', e);
      showNotification('Failed to change user authorization level.');
    }
  };

  // Delete User Account Profile
  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      
      // Write System Activity Log
      try {
        const sysLog = {
          type: 'user_delete' as const,
          userEmail: user?.email || 'admin@myday.com',
          userName: user?.displayName || 'Admin',
          details: `Permanently deleted user profile for "${userToDelete?.fullName || 'Anonymous'}" (${userToDelete?.email || ''})`,
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };
        await logSystemActivity(sysLog);
        setActivityLogs(prev => [sysLog, ...prev]);
      } catch (logErr) {
        console.error('Failed to write user delete system log', logErr);
      }

      showNotification('User profile permanently removed.');
      setUserToDelete(null);
    } catch (e) {
      console.error('Error removing user', e);
      showNotification('Failed to delete user profile.');
    }
  };

  // Toggle Vendor Verification State
  const handleToggleVendorVerification = async (vendorId: string, currentStatus: boolean) => {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      await updateDoc(vendorRef, { verified: !currentStatus });
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, verified: !currentStatus } : v));
      showNotification(`Vendor verification status ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } catch (e) {
      console.error('Error toggling vendor verification', e);
      showNotification('Failed to update vendor verification.');
    }
  };

  // Change Booking State
  const handleChangeBookingStatus = async (bookingId: string, status: DBBooking['bookingStatus']) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { bookingStatus: status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingStatus: status } : b));
      showNotification(`Booking status successfully set to "${status}".`);
    } catch (e) {
      console.error('Error updating booking status', e);
      showNotification('Failed to update booking status.');
    }
  };

  // Change Booking Payment State
  const handleChangeBookingPaymentStatus = async (bookingId: string, status: DBBooking['paymentStatus']) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { paymentStatus: status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paymentStatus: status } : b));
      showNotification(`Booking payment status updated to "${status}".`);
    } catch (e) {
      console.error('Error updating payment status', e);
      showNotification('Failed to update payment details.');
    }
  };

  // Statistics & Financials Aggregation
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const pendingAppsCount = applications.filter(a => a.status === 'Pending').length;
  const activeVendorsCount = vendors.length;
  const activeUsersCount = users.length;

  // Chart preparation helper: Bookings by date (for Revenue area chart)
  const getRevenueChartData = () => {
    const revenueMap: { [date: string]: number } = {};
    
    // Seed last 5 days with zero so there's always a beautiful continuous timeline
    for (let i = 4; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      revenueMap[date] = 0;
    }

    bookings.forEach(b => {
      const bDate = b.bookingDate || new Date().toISOString().split('T')[0];
      if (revenueMap[bDate] !== undefined) {
        revenueMap[bDate] += b.totalAmount || 0;
      } else {
        revenueMap[bDate] = b.totalAmount || 0;
      }
    });

    return Object.keys(revenueMap).sort().map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenueMap[date]
    }));
  };

  // Chart preparation helper: Bookings by status (for Pie Chart)
  const getBookingStatusData = () => {
    const statusCounts = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    bookings.forEach(b => {
      if (statusCounts[b.bookingStatus] !== undefined) {
        statusCounts[b.bookingStatus]++;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.toUpperCase(),
      value: statusCounts[status as keyof typeof statusCounts]
    }));
  };

  // Chart preparation helper: Vendors by Category
  const getVendorsByCategoryData = () => {
    const categoryCounts: { [cat: string]: number } = {};
    vendors.forEach(v => {
      categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
    });

    return Object.keys(categoryCounts).map(cat => ({
      category: cat,
      count: categoryCounts[cat]
    }));
  };

  // Render components safely
  const COLORS = ['#6C4CF1', '#F4B400', '#10B981', '#EF4444'];

  const filteredApplications = applications.filter(a => {
    if (appFilter === 'all') return true;
    return a.status === appFilter;
  });

  const filteredUsers = users.filter(u => {
    const search = userSearch.toLowerCase();
    return u.fullName?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search) || u.role?.toLowerCase().includes(search);
  });

  const filteredVendors = vendors.filter(v => {
    const search = vendorSearch.toLowerCase();
    return v.vendorName?.toLowerCase().includes(search) || v.category?.toLowerCase().includes(search) || v.location?.toLowerCase().includes(search);
  });

  const filteredLogs = activityLogs.filter(log => {
    if (!logSearch) return true;
    const term = logSearch.toLowerCase();
    return (
      (log.userName || '').toLowerCase().includes(term) ||
      (log.userEmail || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term) ||
      (log.type || '').toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div id="admin-loader-container" className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#6C4CF1] animate-spin" />
        <p className="text-sm font-semibold text-neutral-600">Syncing with MyDay Core Firestore Database...</p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 font-sans bg-neutral-50/50">
      
      {/* 1. Header Hero Banner */}
      <div id="admin-header-banner" className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-3xl text-white shadow-lg shadow-neutral-900/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(108,76,241,0.15),transparent)] pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Master System Administrator</span>
          </div>
          <h2 className="text-3xl font-display font-black tracking-tight">Admin Console</h2>
          <p className="text-sm text-neutral-400 font-light max-w-lg leading-relaxed">
            Monitor real-time analytics, verify artisan vendors, review booking workflows, and moderate platform membership profiles.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <button 
            id="admin-refresh-data-btn"
            onClick={fetchAllAdminData}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 text-sm font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* 2. Platform KPIs Overview Panel */}
      <div id="admin-kpi-panel" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card id="kpi-users-card" className="border-neutral-100 hover:border-indigo-100 bg-white shadow-xs transition-all">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">Total Users</p>
              <h3 className="text-2xl font-black text-neutral-800 mt-1">{activeUsersCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card id="kpi-vendors-card" className="border-neutral-100 hover:border-emerald-100 bg-white shadow-xs transition-all">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">Active Vendors</p>
              <h3 className="text-2xl font-black text-neutral-800 mt-1">{activeVendorsCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card id="kpi-applications-card" className="border-neutral-100 hover:border-amber-100 bg-white shadow-xs transition-all">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">Pending Apps</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingAppsCount}</h3>
            </div>
          </CardBody>
        </Card>

        <Card id="kpi-bookings-card" className="border-neutral-100 hover:border-purple-100 bg-white shadow-xs transition-all">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6C4CF1] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">Bookings</p>
              <h3 className="text-2xl font-black text-neutral-800 mt-1">{bookings.length}</h3>
            </div>
          </CardBody>
        </Card>

        <Card id="kpi-revenue-card" className="border-neutral-100 hover:border-teal-100 bg-white shadow-xs transition-all sm:col-span-2 lg:col-span-1">
          <CardBody className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">Est. Revenue</p>
              <h3 className="text-xl font-black text-neutral-800 mt-1">₦{totalRevenue.toLocaleString()}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3. Tab Selection Bar */}
      <div id="admin-tabs-bar" className="flex items-center space-x-1.5 p-1.5 bg-neutral-200/50 rounded-2xl overflow-x-auto scrollbar-none border border-neutral-200/30">
        <button
          id="tab-overview"
          onClick={() => setAdminTab('overview')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'overview' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#6C4CF1]" />
          <span>Overview</span>
        </button>
        <button
          id="tab-applications"
          onClick={() => setAdminTab('applications')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'applications' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <Briefcase className="w-4 h-4 text-amber-500" />
          <span>Applications ({pendingAppsCount})</span>
        </button>
        <button
          id="tab-users"
          onClick={() => setAdminTab('users')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'users' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>User Database</span>
        </button>
        <button
          id="tab-vendors"
          onClick={() => setAdminTab('vendors')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'vendors' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <Store className="w-4 h-4 text-emerald-500" />
          <span>Vendors Catalog</span>
        </button>
        <button
          id="tab-bookings"
          onClick={() => setAdminTab('bookings')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'bookings' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <Calendar className="w-4 h-4 text-purple-500" />
          <span>Bookings List</span>
        </button>
        <button
          id="tab-history"
          onClick={() => setAdminTab('history')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'history' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <FileText className="w-4 h-4 text-[#F4B400]" />
          <span>Approval History ({approvalHistory.length})</span>
        </button>
        <button
          id="tab-logs"
          onClick={() => setAdminTab('logs')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${adminTab === 'logs' ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/30'}`}
        >
          <Layers className="w-4 h-4 text-pink-500" />
          <span>System Activity Logs ({activityLogs.length})</span>
        </button>
      </div>

      {/* 4. Tab Views Panel */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: OVERVIEW & ANALYTICS */}
        {adminTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="admin-overview-tab-panel"
          >
            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart A: Monthly Revenue Trends & Platform Growth (D3.js) */}
              <Card id="chart-revenue-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-neutral-800 text-lg">Platform Revenue & MoM Growth</h4>
                      <p className="text-xs text-neutral-400 font-light mt-0.5">Interactive D3 analytics showing monthly platform cash flow, order volumes and trends</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-teal-500" />
                  </div>
                  <div className="pt-2">
                    <D3RevenueLineChart bookings={bookings} />
                  </div>
                </CardBody>
              </Card>

              {/* Chart B: Category Distribution */}
              <Card id="chart-categories-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-neutral-800 text-lg">Artisans by Category</h4>
                      <p className="text-xs text-neutral-400 font-light mt-0.5">Spread of active registered service providers on MyDay</p>
                    </div>
                    <Layers className="w-5 h-5 text-[#6C4CF1]" />
                  </div>
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getVendorsByCategoryData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value) => [value, 'Vendors Count']} />
                        <Bar dataKey="count" fill="#6C4CF1" radius={[8, 8, 0, 0]} barSize={36}>
                          {getVendorsByCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Chart C: Target Revenue Gauge (D3.js) */}
              <Card id="chart-gauge-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-neutral-800 text-lg">Monthly Revenue Target</h4>
                      <p className="text-xs text-neutral-400 font-light mt-0.5">Real-time D3 radial gauge tracking current month transaction progress against target</p>
                    </div>
                    <Target className="w-5 h-5 text-[#6C4CF1]" />
                  </div>
                  <div className="pt-2">
                    <D3RevenueGauge bookings={bookings} />
                  </div>
                </CardBody>
              </Card>

            </div>

            {/* Split row: Booking Status Breakdown & Recent Applications Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <Card id="chart-booking-status-card" className="border-neutral-100 bg-white p-6 shadow-xs lg:col-span-1 flex flex-col justify-between">
                <CardBody className="space-y-4">
                  <h4 className="font-display font-bold text-neutral-800 text-md">Booking Funnel Status</h4>
                  <p className="text-xs text-neutral-400 font-light">Status tracking of client reservations</p>
                  
                  <div className="h-44 w-full flex items-center justify-center relative">
                    {bookings.length === 0 ? (
                      <span className="text-xs font-medium text-neutral-400">No active reservations found</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={getBookingStatusData().filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getBookingStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    {getBookingStatusData().map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="font-semibold text-neutral-600">{item.name}</span>
                        </div>
                        <span className="font-bold text-neutral-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Quick Applications Tracker */}
              <Card id="recent-apps-overview-card" className="border-neutral-100 bg-white p-6 shadow-xs lg:col-span-2">
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-neutral-800 text-lg">Incoming Applications Queue</h4>
                    <button 
                      onClick={() => setAdminTab('applications')}
                      className="text-xs font-semibold text-[#6C4CF1] hover:underline flex items-center space-x-1"
                    >
                      <span>Review All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 font-light">Kwara State business entities waiting for platform authorization</p>

                  <div className="space-y-3.5 pt-2">
                    {applications.filter(a => a.status === 'Pending').slice(0, 3).length === 0 ? (
                      <div className="py-8 text-center space-y-2 border border-dashed border-neutral-200 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-neutral-700">Perfect alignment!</p>
                        <p className="text-[11px] text-neutral-400 font-light">No pending artisan applications in queue.</p>
                      </div>
                    ) : (
                      applications.filter(a => a.status === 'Pending').slice(0, 3).map((app) => (
                        <div 
                          key={app.applicationId}
                          className="p-4 border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-neutral-900">{app.businessName}</h5>
                            <p className="text-xs text-neutral-500">{app.category} • {app.city}, {app.state}</p>
                            <p className="text-[11px] text-neutral-400">Submitted by {app.ownerName} on {new Date(app.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Real-time Toggle Switch for quick approval/rejection */}
                            <div className="flex items-center space-x-2 bg-neutral-100/70 hover:bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200/40 transition-all">
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${app.status === 'Rejected' ? 'text-red-500' : 'text-neutral-400'}`}>
                                Decline
                              </span>
                              
                              <button
                                id={`quick-toggle-${app.applicationId}`}
                                role="switch"
                                aria-checked={app.status === 'Approved'}
                                disabled={isActionLoading !== null}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (app.status === 'Approved') {
                                    await handleRejectApplication(app);
                                  } else {
                                    await handleApproveApplication(app);
                                  }
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  app.status === 'Approved' ? 'bg-emerald-500' : 
                                  app.status === 'Rejected' ? 'bg-red-500' : 'bg-neutral-300'
                                } ${isActionLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    app.status === 'Approved' ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${app.status === 'Approved' ? 'text-emerald-500' : 'text-neutral-400'}`}>
                                Approve
                              </span>
                              
                              {isActionLoading === app.applicationId && (
                                <Loader2 className="w-3.5 h-3.5 text-[#6C4CF1] animate-spin shrink-0" />
                              )}
                            </div>

                            <button
                              id={`quick-app-view-${app.applicationId}`}
                              onClick={() => {
                                setSelectedApp(app);
                                setAdminTab('applications');
                              }}
                              className="px-3.5 py-1.5 border border-neutral-200 bg-white hover:border-[#6C4CF1] text-[11px] font-bold uppercase tracking-wider rounded-lg text-neutral-700 cursor-pointer transition-all"
                            >
                              Review Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>

            </div>

            {/* Auditing and Data Export Hub */}
            <Card id="admin-export-audit-card" className="border-neutral-100 bg-white p-6 shadow-xs animate-in fade-in duration-300">
              <CardBody className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#6C4CF1]" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-neutral-800 text-md">Platform Compliance & Audit Hub</h4>
                      <p className="text-xs text-neutral-400 font-light">Export complete system records to CSV spreadsheets for compliance verification, performance analytics, and offline auditing</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 border border-neutral-100 bg-neutral-50/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-all">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-neutral-700">User Directory Ledger</h5>
                      <p className="text-[10px] text-neutral-400 font-light">Contains profile metrics, emails, roles, and registration dates ({users.length} profiles)</p>
                    </div>
                    <button
                      id="export-users-csv-overview-btn"
                      onClick={handleExportUsersCSV}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Users CSV</span>
                    </button>
                  </div>

                  <div className="p-4 border border-neutral-100 bg-neutral-50/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-all">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-neutral-700">Artisan Directory Ledger</h5>
                      <p className="text-[10px] text-neutral-400 font-light">Contains vendor categories, physical locations, ratings, and pricing tiers ({vendors.length} vendors)</p>
                    </div>
                    <button
                      id="export-vendors-csv-overview-btn"
                      onClick={handleExportVendorsCSV}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-[#6C4CF1] hover:bg-[#5b3ed9] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Vendors CSV</span>
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 2: VENDOR APPLICATIONS REVIEW */}
        {adminTab === 'applications' && (
          <motion.div
            key="applications"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="admin-applications-tab-panel"
          >
            <Card id="applications-table-card" className="border-neutral-100 bg-white p-6 shadow-xs">
              <CardBody className="space-y-6">
                
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-neutral-800 text-xl">Vendor Onboarding Registry</h3>
                    <p className="text-xs text-neutral-400 font-light mt-0.5">Verify certifications, portfolios, and commercial details for Kwara vendors</p>
                  </div>
                  
                  {/* Status Filters */}
                  <div className="flex items-center space-x-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-center">
                    {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAppFilter(filter)}
                        className={`px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${appFilter === filter ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main List */}
                <div className="space-y-4">
                  {filteredApplications.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <Briefcase className="w-12 h-12 text-neutral-300 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-600">No applications found</h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto font-light">There are no onboarding profiles matching the selected status filters.</p>
                    </div>
                  ) : (
                    filteredApplications.map((app) => (
                      <div 
                        key={app.applicationId}
                        className="border border-neutral-100 bg-neutral-50/20 hover:bg-neutral-50/50 rounded-2xl p-6 transition-all space-y-4"
                      >
                        {/* Summary Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C4CF1]/10 to-[#F4B400]/10 flex items-center justify-center shrink-0">
                              <Store className="w-6 h-6 text-[#6C4CF1]" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-neutral-900">{app.businessName}</h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  app.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                  app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                  'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-neutral-600">
                                {app.category} • {app.city}, {app.state}
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions: Real-time Toggle Switch */}
                          <div className="flex items-center space-x-3 bg-neutral-100/60 hover:bg-neutral-100 px-3.5 py-2 rounded-2xl border border-neutral-200/50 transition-all self-start md:self-center">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Status Toggle</span>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest transition-colors ${
                                app.status === 'Rejected' ? 'text-red-500 font-black' : 'text-neutral-400'
                              }`}>
                                Declined
                              </span>
                              
                              <button
                                id={`toggle-switch-${app.applicationId}`}
                                role="switch"
                                aria-checked={app.status === 'Approved'}
                                disabled={isActionLoading !== null}
                                onClick={async () => {
                                  if (app.status === 'Approved') {
                                    await handleRejectApplication(app);
                                  } else {
                                    await handleApproveApplication(app);
                                  }
                                }}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  app.status === 'Approved' ? 'bg-emerald-500' : 
                                  app.status === 'Rejected' ? 'bg-red-500' : 'bg-neutral-300'
                                } ${isActionLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    app.status === 'Approved' ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest transition-colors ${
                                app.status === 'Approved' ? 'text-emerald-500 font-black' : 'text-neutral-400'
                              }`}>
                                Approved
                              </span>
                            </div>

                            {isActionLoading === app.applicationId && (
                              <Loader2 className="w-4 h-4 text-[#6C4CF1] animate-spin shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Expandable Application Metadata Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-2">
                          <div className="space-y-2.5">
                            <h5 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] font-mono">Contact & Owner Info</h5>
                            <p className="font-semibold text-neutral-800">Owner: <span className="font-medium text-neutral-600">{app.ownerName}</span></p>
                            <p className="flex items-center space-x-1.5 text-neutral-600">
                              <Mail className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{app.email}</span>
                            </p>
                            <p className="flex items-center space-x-1.5 text-neutral-600">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{app.phone} (WhatsApp: {app.whatsapp || 'N/A'})</span>
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <h5 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] font-mono">Business Biography</h5>
                            <p className="font-semibold text-neutral-800">Experience: <span className="font-medium text-neutral-600">{app.yearsInBusiness} years in business</span></p>
                            <p className="text-neutral-600 leading-relaxed font-light italic bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                              "{app.description || 'No description supplied'}"
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <h5 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] font-mono">Online Handles</h5>
                            <div className="space-y-1">
                              {app.instagram && <p className="text-neutral-600">Instagram: <a href={`https://instagram.com/${app.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[#6C4CF1] hover:underline font-medium inline-flex items-center gap-0.5">{app.instagram}<ExternalLink className="w-2.5 h-2.5" /></a></p>}
                              {app.facebook && <p className="text-neutral-600">Facebook: <span className="font-medium text-neutral-800">{app.facebook}</span></p>}
                              {app.tiktok && <p className="text-neutral-600">TikTok: <span className="font-medium text-neutral-800">{app.tiktok}</span></p>}
                              {app.website && <p className="text-neutral-600">Website: <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-[#6C4CF1] hover:underline font-medium inline-flex items-center gap-0.5">Visit Link<ExternalLink className="w-2.5 h-2.5" /></a></p>}
                            </div>
                          </div>
                        </div>

                        {/* Portfolio Images Grid */}
                        {app.portfolioImages && app.portfolioImages.length > 0 && (
                          <div className="pt-2">
                            <h5 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] font-mono mb-2">Portfolio Showcases</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                              {app.portfolioImages.map((img, index) => (
                                <div key={index} className="aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/50">
                                  <img src={img} alt="portfolio block" className="w-full h-full object-cover hover:scale-105 transition-all" referrerPolicy="no-referrer" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>

              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 3: USER DATABASE MANAGEMENT */}
        {adminTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="admin-users-tab-panel"
          >
            <Card id="users-registry-card" className="border-neutral-100 bg-white p-6 shadow-xs">
              <CardBody className="space-y-6">
                
                {/* Search Bar & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-neutral-800 text-xl">User Account Directory</h3>
                    <p className="text-xs text-neutral-400 font-light mt-0.5">Direct Firestore controls over accounts, permissions, and roles</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    <button
                      id="export-users-csv-tab-btn"
                      onClick={handleExportUsersCSV}
                      className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <input
                      id="user-search-input"
                      type="text"
                      placeholder="Search by name, email, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-[#6C4CF1] rounded-xl text-xs transition-all focus:outline-none w-full sm:max-w-xs shrink-0"
                    />
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table id="users-db-table" className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-400 font-mono font-bold uppercase tracking-wider">
                        <th className="py-4 px-3">Name</th>
                        <th className="py-4 px-3">Email Address</th>
                        <th className="py-4 px-3">Registered At</th>
                        <th className="py-4 px-3">Active Role</th>
                        <th className="py-4 px-3 text-center">Modify Level</th>
                        <th className="py-4 px-3 text-right">Delete Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 text-neutral-700">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-neutral-400">
                            No users matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-4 px-3 font-semibold text-neutral-900 flex items-center space-x-2.5">
                              {u.profileImage ? (
                                <img src={u.profileImage} alt="avatar" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center font-bold">
                                  {u.fullName?.charAt(0) || 'U'}
                                </div>
                              )}
                              <span>{u.fullName}</span>
                            </td>
                            <td className="py-4 px-3 text-neutral-500 font-mono">{u.email}</td>
                            <td className="py-4 px-3 text-neutral-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-4 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                u.role === 'vendor' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                'bg-indigo-50 text-indigo-600 border border-indigo-200'
                              }`}>
                                {u.role || 'customer'}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                              <select
                                id={`role-dropdown-${u.uid}`}
                                value={u.role || 'customer'}
                                onChange={(e) => handleChangeUserRole(u.uid, e.target.value as any)}
                                className="px-2 py-1 bg-white border border-neutral-200 text-[11px] font-medium rounded-lg focus:outline-none focus:border-[#6C4CF1] cursor-pointer"
                              >
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <button
                                id={`user-delete-btn-${u.uid}`}
                                disabled={u.email?.toLowerCase() === 'akinwandemelody49@gmail.com'}
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Delete user profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 4: VENDORS CATALOG LIST */}
        {adminTab === 'vendors' && (
          <motion.div
            key="vendors"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="admin-vendors-tab-panel"
          >
            <Card id="vendors-catalog-card" className="border-neutral-100 bg-white p-6 shadow-xs">
              <CardBody className="space-y-6">
                
                {/* Search & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-neutral-800 text-xl">Active Artisans Directory</h3>
                    <p className="text-xs text-neutral-400 font-light mt-0.5">Review verified statuses, ratings, descriptions and price brackets</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    <button
                      id="export-vendors-csv-tab-btn"
                      onClick={handleExportVendorsCSV}
                      className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-[#6C4CF1] hover:bg-[#5b3ed9] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <input
                      id="vendor-search-input"
                      type="text"
                      placeholder="Search by vendor name, category, or location..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      className="px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-[#6C4CF1] rounded-xl text-xs transition-all focus:outline-none w-full sm:max-w-xs shrink-0"
                    />
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVendors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-neutral-400">
                      No active vendors matched your search catalog query.
                    </div>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <div 
                        key={vendor.id}
                        className="border border-neutral-100 rounded-2xl overflow-hidden bg-neutral-50/20 hover:bg-white hover:shadow-md hover:border-[#6C4CF1]/15 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Banner */}
                          <div className="h-40 relative bg-neutral-100">
                            <img src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400'} alt={vendor.vendorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-3 right-3 px-2 py-0.5 bg-neutral-900/60 backdrop-blur-xs text-white font-mono text-[9px] uppercase tracking-wider rounded-md font-bold">
                              {vendor.category}
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="p-5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-neutral-900 text-sm leading-tight">{vendor.vendorName}</h4>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span className="text-amber-500 text-xs font-bold font-mono">★</span>
                                <span className="text-neutral-700 text-xs font-bold font-mono">{vendor.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 leading-normal font-light line-clamp-3">
                              {vendor.description}
                            </p>
                            <p className="text-[11px] font-semibold text-neutral-500 flex items-center space-x-1">
                              <span>📍 {vendor.location}</span>
                              <span>•</span>
                              <span className="font-mono uppercase text-[#6C4CF1]">{vendor.priceRange} budget</span>
                            </p>
                          </div>
                        </div>

                        {/* Direct Controls */}
                        <div className="p-5 pt-0 border-t border-neutral-50 mt-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-400 font-mono">Verification status:</span>
                          <button
                            id={`vendor-verify-toggle-${vendor.id}`}
                            onClick={() => handleToggleVendorVerification(vendor.id || '', vendor.verified)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${vendor.verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}
                          >
                            {vendor.verified ? 'Verified Active' : 'Unverified Draft'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 5: BOOKINGS SYSTEM MODERATION */}
        {adminTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="admin-bookings-tab-panel"
          >
            <Card id="bookings-management-card" className="border-neutral-100 bg-white p-6 shadow-xs">
              <CardBody className="space-y-6">
                
                <div>
                  <h3 className="font-display font-bold text-neutral-800 text-xl">Platform-wide Bookings Registry</h3>
                  <p className="text-xs text-neutral-400 font-light mt-0.5">Control operational states and financial settlement tags of active contracts</p>
                </div>

                <div className="overflow-x-auto">
                  <table id="bookings-list-table" className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-400 font-mono font-bold uppercase tracking-wider">
                        <th className="py-4 px-3">Booking ID</th>
                        <th className="py-4 px-3">Client</th>
                        <th className="py-4 px-3">Vendor / Service</th>
                        <th className="py-4 px-3">Delivery Date</th>
                        <th className="py-4 px-3">Total Cost</th>
                        <th className="py-4 px-3">Reservation Status</th>
                        <th className="py-4 px-3">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 text-neutral-700">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-neutral-400">
                            No reservations have been booked on the platform yet.
                          </td>
                        </tr>
                      ) : (
                        bookings.map((booking) => {
                          const vendorObj = vendors.find(v => v.id === booking.vendorId);
                          return (
                            <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="py-4 px-3 font-mono text-neutral-400 font-bold">#{booking.id?.slice(-6) || booking.birthdayPlanId?.slice(-6) || '872A99'}</td>
                              <td className="py-4 px-3 font-semibold text-neutral-900">
                                <div>{booking.userName || 'Customer'}</div>
                                <div className="text-[10px] text-neutral-400 font-normal font-mono">{booking.userEmail}</div>
                              </td>
                              <td className="py-4 px-3 font-semibold text-neutral-700">
                                <div>{vendorObj?.vendorName || 'Artisan Service'}</div>
                                <div className="text-[10px] text-neutral-400 font-mono font-normal">Cat: {vendorObj?.category || 'Catering'}</div>
                              </td>
                              <td className="py-4 px-3 text-neutral-500 font-medium">{booking.bookingDate}</td>
                              <td className="py-4 px-3 font-bold text-neutral-900">₦{booking.totalAmount?.toLocaleString()}</td>
                              <td className="py-4 px-3">
                                <select
                                  id={`booking-status-dropdown-${booking.id}`}
                                  value={booking.bookingStatus}
                                  onChange={(e) => handleChangeBookingStatus(booking.id || '', e.target.value as any)}
                                  className={`px-2 py-1 border text-[11px] font-medium rounded-lg cursor-pointer focus:outline-none ${
                                    booking.bookingStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    booking.bookingStatus === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    booking.bookingStatus === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </td>
                              <td className="py-4 px-3">
                                <select
                                  id={`payment-status-dropdown-${booking.id}`}
                                  value={booking.paymentStatus}
                                  onChange={(e) => handleChangeBookingPaymentStatus(booking.id || '', e.target.value as any)}
                                  className={`px-2 py-1 border text-[11px] font-medium rounded-lg cursor-pointer focus:outline-none ${
                                    booking.paymentStatus === 'paid' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                    booking.paymentStatus === 'partial' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                    booking.paymentStatus === 'refunded' ? 'bg-neutral-100 text-neutral-600 border-neutral-300' :
                                    'bg-red-50 text-red-500 border-red-200'
                                  }`}
                                >
                                  <option value="unpaid">Unpaid</option>
                                  <option value="partial">Partial</option>
                                  <option value="paid">Paid</option>
                                  <option value="refunded">Refunded</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 6: APPROVAL HISTORY LOG */}
        {adminTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card id="history-total-logs-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4B400]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Total Logs</span>
                    <h4 className="text-2xl font-black text-neutral-800 font-display">{approvalHistory.length}</h4>
                  </div>
                </CardBody>
              </Card>

              <Card id="history-approved-logs-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Approved</span>
                    <h4 className="text-2xl font-black text-neutral-800 font-display">
                      {approvalHistory.filter(h => h.action === 'Approved').length}
                    </h4>
                  </div>
                </CardBody>
              </Card>

              <Card id="history-rejected-logs-card" className="border-neutral-100 bg-white p-6 shadow-xs">
                <CardBody className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Declined</span>
                    <h4 className="text-2xl font-black text-neutral-800 font-display">
                      {approvalHistory.filter(h => h.action === 'Rejected').length}
                    </h4>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Audit Trail Card Table */}
            <Card id="approval-history-table-card" className="border-neutral-100 bg-white shadow-xs overflow-hidden">
              <CardBody className="p-0">
                <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-neutral-50/30">
                  <div>
                    <h4 className="font-display font-bold text-neutral-800 text-lg">Vendor Audit Trail</h4>
                    <p className="text-xs text-neutral-400 font-light">Chronological ledger of vendor approval and decline decisions</p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const historySnap = await getDocs(collection(db, 'approvalHistory'));
                        const fetchedHistory: ApprovalHistoryLog[] = [];
                        historySnap.forEach((d) => {
                          fetchedHistory.push({ id: d.id, ...d.data() } as any);
                        });
                        fetchedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        setApprovalHistory(fetchedHistory);
                        showNotification('Audit log synchronized successfully!');
                      } catch (err) {
                        console.error(err);
                        showNotification('Failed to sync audit log.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="self-start md:self-center flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-neutral-600 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Trail</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {approvalHistory.length === 0 ? (
                    <div className="py-24 text-center space-y-3">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-600">No History Records Found</h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto font-light">
                        Actions performed on vendor applications will be cataloged and listed in this chronological ledger.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50/40 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                          <th className="py-3.5 px-6">Timestamp</th>
                          <th className="py-3.5 px-6">Business & Owner</th>
                          <th className="py-3.5 px-6">Category</th>
                          <th className="py-3.5 px-6">Action</th>
                          <th className="py-3.5 px-6">Moderated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs text-neutral-600">
                        {approvalHistory.map((log) => {
                          const logDate = new Date(log.timestamp);
                          return (
                            <tr key={log.id} className="hover:bg-neutral-50/30 transition-all">
                              <td className="py-4 px-6 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                <div className="font-semibold text-neutral-800">
                                  {logDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-[10px] text-neutral-400 font-light">
                                  {logDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-neutral-900 text-sm">{log.businessName}</div>
                                <div className="text-[11px] text-neutral-400 font-light">
                                  Owner: <span className="font-medium text-neutral-600">{log.ownerName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider">
                                  {log.category}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-[10px] font-extrabold font-mono uppercase tracking-widest ${
                                  log.action === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                  {log.action === 'Approved' ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span>{log.action}</span>
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-semibold text-neutral-800">{log.adminName}</div>
                                <div className="text-[10px] text-neutral-400 font-mono">{log.adminEmail}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* VIEW 7: SYSTEM ACTIVITY LOGS */}
        {adminTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card id="logs-total-card" className="border-neutral-100 bg-white p-5 shadow-xs">
                <CardBody className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Total Records</span>
                    <h4 className="text-xl font-black text-neutral-800 font-display">{activityLogs.length}</h4>
                  </div>
                </CardBody>
              </Card>

              <Card id="logs-logins-card" className="border-neutral-100 bg-white p-5 shadow-xs">
                <CardBody className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">User Logins</span>
                    <h4 className="text-xl font-black text-neutral-800 font-display">
                      {activityLogs.filter(l => l.type === 'login').length}
                    </h4>
                  </div>
                </CardBody>
              </Card>

              <Card id="logs-approvals-card" className="border-neutral-100 bg-white p-5 shadow-xs">
                <CardBody className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Admin Approvals</span>
                    <h4 className="text-xl font-black text-neutral-800 font-display">
                      {activityLogs.filter(l => l.type === 'vendor_approved').length}
                    </h4>
                  </div>
                </CardBody>
              </Card>

              <Card id="logs-exports-card" className="border-neutral-100 bg-white p-5 shadow-xs">
                <CardBody className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">CSV Exports</span>
                    <h4 className="text-xl font-black text-neutral-800 font-display">
                      {activityLogs.filter(l => l.type === 'csv_export').length}
                    </h4>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Filter and Table Container */}
            <Card id="system-activity-logs-card" className="border-neutral-100 bg-white shadow-xs overflow-hidden">
              <CardBody className="p-0">
                <div className="p-6 border-b border-neutral-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-neutral-50/30">
                  <div>
                    <h4 className="font-display font-bold text-neutral-800 text-lg">System Activity Log Ledger</h4>
                    <p className="text-xs text-neutral-400 font-light">Real-time audit record tracking user logons, security operations, and platform management transactions</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Field */}
                    <input
                      id="log-search-input"
                      type="text"
                      placeholder="Search by name, email, details..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="px-4 py-2 bg-neutral-50 border border-neutral-200 focus:border-neutral-300 focus:bg-white rounded-xl text-xs font-medium focus:outline-none placeholder-neutral-400 w-full sm:w-64 transition-all"
                    />
                    
                    <button
                      id="sync-logs-btn"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const fetchedLogs = await getSystemActivityLogs();
                          setActivityLogs(fetchedLogs);
                          showNotification('System activity log refreshed successfully!');
                        } catch (err) {
                          console.error(err);
                          showNotification('Failed to refresh activity log.');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#6C4CF1] hover:bg-[#5B3DE0] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh Logs</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="py-24 text-center space-y-3">
                      <Layers className="w-12 h-12 text-neutral-300 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-600">No Activity Logs Found</h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto font-light">
                        {logSearch ? 'No logs match your search criteria.' : 'Real-time events like admin decisions, system downloads, and sign-ins will register automatically here.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50/40 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                          <th className="py-3.5 px-6">Timestamp</th>
                          <th className="py-3.5 px-6">Event Type</th>
                          <th className="py-3.5 px-6">Actor Details</th>
                          <th className="py-3.5 px-6">Action / Transaction Record</th>
                          <th className="py-3.5 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs text-neutral-600">
                        {filteredLogs.map((log, index) => {
                          const logDate = new Date(log.timestamp);
                          
                          // Icon and Styling Resolver
                          let typeBadgeColor = 'bg-neutral-100 text-neutral-700';
                          let typeLabel = 'System Action';
                          
                          if (log.type === 'login') {
                            typeBadgeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
                            typeLabel = 'Session Login';
                          } else if (log.type === 'vendor_approved') {
                            typeBadgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                            typeLabel = 'Artisan Approval';
                          } else if (log.type === 'vendor_rejected') {
                            typeBadgeColor = 'bg-red-50 text-red-700 border border-red-100';
                            typeLabel = 'Artisan Declined';
                          } else if (log.type === 'user_role_update') {
                            typeBadgeColor = 'bg-amber-50 text-amber-700 border border-amber-100';
                            typeLabel = 'Role Update';
                          } else if (log.type === 'user_delete') {
                            typeBadgeColor = 'bg-purple-50 text-purple-700 border border-purple-100';
                            typeLabel = 'User Erased';
                          } else if (log.type === 'csv_export') {
                            typeBadgeColor = 'bg-teal-50 text-teal-700 border border-teal-100';
                            typeLabel = 'CSV Download';
                          }

                          return (
                            <tr key={log.id || `sys_log_${index}_${logDate.getTime()}`} className="hover:bg-neutral-50/30 transition-all">
                              {/* Timestamp */}
                              <td className="py-4 px-6 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                <div className="font-semibold text-neutral-800">
                                  {logDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-[10px] text-neutral-400 font-light">
                                  {logDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </div>
                              </td>

                              {/* Event Badge */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${typeBadgeColor}`}>
                                  {typeLabel}
                                </span>
                              </td>

                              {/* Actor */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="font-bold text-neutral-800">{log.userName || 'Unknown'}</div>
                                <div className="text-[10px] text-neutral-400 font-mono">{log.userEmail}</div>
                              </td>

                              {/* Description Details */}
                              <td className="py-4 px-6 max-w-sm">
                                <div className="font-normal text-neutral-700 break-words leading-relaxed">{log.details}</div>
                              </td>

                              {/* Success status */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${
                                  log.status === 'success' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                                  }`} />
                                  <span>{log.status === 'success' ? 'Success' : 'Failed'}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* 5. Warning / Delete Confirmation Overlay */}
      {userToDelete && (
        <div id="delete-user-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 space-y-6 shadow-xl"
          >
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold font-display">Confirm Profile Removal</h4>
            </div>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Are you absolutely sure you want to permanently delete the profile for <strong>{userToDelete.fullName}</strong> ({userToDelete.email})? This action is irreversible and deletes their client databases synchronously from Firestore.
            </p>
            <div className="flex items-center space-x-3 justify-end pt-2">
              <button
                id="cancel-delete-user-btn"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-user-btn"
                onClick={() => handleDeleteUser(userToDelete.uid)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Real-time Export Toast Floating Container */}
      <div id="export-toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {exportToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="pointer-events-auto w-full bg-neutral-900/95 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl flex gap-3 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
              
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-white tracking-wide">{toast.title}</h5>
                  <button
                    onClick={() => setExportToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="text-neutral-500 hover:text-white transition-colors cursor-pointer text-[10px] uppercase font-bold tracking-wider"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                  {toast.message}
                </p>
                <div className="pt-2 flex flex-col gap-1">
                  <div className="flex justify-between text-[9px] font-mono font-medium text-neutral-400">
                    <span className="truncate max-w-[180px]">{toast.fileName}</span>
                    <span>100% Complete</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5 }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};
