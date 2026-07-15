import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

// -----------------------------------------------------------------------------
// Operation Types & Error Handling (As mandated by the Firebase Integration Skill)
// -----------------------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  return (
    errMsg.toLowerCase().includes('offline') ||
    errMsg.toLowerCase().includes('unreachable') ||
    errMsg.toLowerCase().includes('could not reach cloud firestore backend') ||
    errCode === 'unavailable' ||
    errCode === 'failed-precondition'
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineError(error)) {
    console.warn('Firestore operating in offline/cached fallback mode:', errMsg);
    return;
  }

  console.error('Firestore Error Context:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -----------------------------------------------------------------------------
// Types Definitions for MyDay Collections
// -----------------------------------------------------------------------------

export interface DBUserProfile {
  uid: string;
  fullName: string;
  email: string;
  profileImage?: string;
  city?: string;
  preferredStyle?: string;
  averageBudget?: number;
  createdAt: string;
  updatedAt: string;
  role?: 'customer' | 'vendor' | 'admin';
}

export interface DBBirthdayPlan {
  id?: string;
  userId: string;
  recipientName: string;
  relationship?: string;
  birthdayDate: string;
  age: number;
  budget: number;
  city?: string;
  guests: number;
  celebrationStyle?: string;
  interests: string[];
  aiPlan?: any; // Represents the customized AI orchestration output (itinerary, themes)
  status: 'draft' | 'planning' | 'booked' | 'completed';
  createdAt: string;
}

export interface DBVendor {
  id?: string;
  vendorName: string;
  category: 'Cakes' | 'Decorators' | 'Photographers' | 'Restaurants' | 'Gift Shops' | 'Entertainment' | 'Venues';
  description: string;
  location: string;
  images: string[];
  phone?: string;
  email?: string;
  rating: number;
  priceRange: 'low' | 'medium' | 'high' | 'luxury';
  verified: boolean;
  availabilityStatus?: 'Available' | 'Fully Booked' | 'Weekends Only' | 'On Break';
}

export interface DBBooking {
  id?: string;
  userId: string;
  vendorId: string;
  birthdayPlanId: string;
  bookingStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed';
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  bookingDate: string;
  userName?: string;
  userEmail?: string;
  specialRequests?: string;
  createdAt?: string;
}

export interface DBNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// 1. Users Collection Services
// -----------------------------------------------------------------------------

export const saveUserProfile = async (uid: string, profile: Partial<DBUserProfile>): Promise<void> => {
  const path = `users/${uid}`;
  try {
    // Cache locally first so offline reads are immediately populated with latest data
    try {
      const cached = localStorage.getItem(`myday_profile_${uid}`);
      const existing = cached ? JSON.parse(cached) : {};
      const updated = {
        ...existing,
        ...profile,
        uid,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`myday_profile_${uid}`, JSON.stringify(updated));
    } catch (cacheErr) {
      console.warn('Could not cache profile update locally:', cacheErr);
    }

    const docRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(docRef);
    const now = new Date().toISOString();
    
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        ...profile,
        updatedAt: now
      });
    } else {
      const emailVal = profile.email || '';
      const initialRole = emailVal.toLowerCase() === 'akinwandemelody49@gmail.com' ? 'admin' : (profile.role || 'customer');
      const fullProfile: DBUserProfile = {
        uid,
        fullName: profile.fullName || 'Anonymous User',
        email: emailVal,
        profileImage: profile.profileImage || '',
        city: profile.city || '',
        preferredStyle: profile.preferredStyle || '',
        averageBudget: profile.averageBudget || 0,
        createdAt: now,
        updatedAt: now,
        role: initialRole,
        ...profile
      };
      await setDoc(docRef, fullProfile);
    }
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, saved profile update to local cache only for uid:', uid);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (uid: string): Promise<DBUserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as DBUserProfile;
      try {
        localStorage.setItem(`myday_profile_${uid}`, JSON.stringify(data));
      } catch (cacheErr) {
        console.warn('Could not cache profile locally:', cacheErr);
      }
      return data;
    }
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, loading user profile from local cache for uid:', uid);
      try {
        const cached = localStorage.getItem(`myday_profile_${uid}`);
        if (cached) {
          return JSON.parse(cached) as DBUserProfile;
        }
      } catch (cacheErr) {
        console.warn('Error reading cached profile:', cacheErr);
      }
      
      // Return fallback structured default profile to prevent system crashes
      const isEmailAdmin = auth.currentUser?.email?.toLowerCase() === 'akinwandemelody49@gmail.com';
      const fallbackProfile: DBUserProfile = {
        uid,
        fullName: auth.currentUser?.displayName || 'User',
        email: auth.currentUser?.email || '',
        profileImage: auth.currentUser?.photoURL || '',
        city: 'Lagos, Nigeria',
        preferredStyle: 'elegant',
        averageBudget: 1800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: isEmailAdmin ? 'admin' : 'customer'
      };
      return fallbackProfile;
    }

    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

// -----------------------------------------------------------------------------
// 2. Birthday Plans Collection Services
// -----------------------------------------------------------------------------

export const saveBirthdayPlan = async (plan: DBBirthdayPlan): Promise<string> => {
  const planId = plan.id || doc(collection(db, 'birthdayPlans')).id;
  const path = `birthdayPlans/${planId}`;
  
  // Cache locally first
  try {
    const cachedPlansStr = localStorage.getItem('myday_birthday_plans') || '[]';
    let cachedPlans: DBBirthdayPlan[] = JSON.parse(cachedPlansStr);
    if (!Array.isArray(cachedPlans)) cachedPlans = [];
    const existingIndex = cachedPlans.findIndex(p => p.id === planId);
    const updatedPlan = { ...plan, id: planId };
    if (existingIndex >= 0) {
      cachedPlans[existingIndex] = updatedPlan;
    } else {
      cachedPlans.push(updatedPlan);
    }
    localStorage.setItem('myday_birthday_plans', JSON.stringify(cachedPlans));
  } catch (e) {
    console.warn('Failed to cache plan locally:', e);
  }

  try {
    const docRef = doc(db, 'birthdayPlans', planId);
    const dataToSave = { ...plan, id: planId };
    await setDoc(docRef, dataToSave);
    return planId;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, birthday plan saved to local cache only.');
      return planId;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const getBirthdayPlans = async (userId: string): Promise<DBBirthdayPlan[]> => {
  const path = 'birthdayPlans';
  try {
    const q = query(
      collection(db, 'birthdayPlans'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const plans: DBBirthdayPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as DBBirthdayPlan);
    });

    // Sync to local cache
    try {
      const cachedPlansStr = localStorage.getItem('myday_birthday_plans') || '[]';
      let cachedPlans: DBBirthdayPlan[] = JSON.parse(cachedPlansStr);
      if (!Array.isArray(cachedPlans)) cachedPlans = [];
      
      const otherUsersPlans = cachedPlans.filter(p => p.userId !== userId);
      const mergedPlans = [...otherUsersPlans, ...plans];
      localStorage.setItem('myday_birthday_plans', JSON.stringify(mergedPlans));
    } catch (e) {
      console.warn('Failed to sync plans to local cache:', e);
    }

    return plans;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, loading birthday plans from local cache for userId:', userId);
      try {
        const cachedPlansStr = localStorage.getItem('myday_birthday_plans');
        if (cachedPlansStr) {
          const cachedPlans = JSON.parse(cachedPlansStr);
          if (Array.isArray(cachedPlans)) {
            return cachedPlans.filter(p => p.userId === userId) as DBBirthdayPlan[];
          }
        }
      } catch (e) {
        console.warn('Failed to read plans from local cache:', e);
      }
      return [];
    }

    // If standard query fails (e.g. index build required), fall back to non-ordered filter
    try {
      const fallbackQuery = query(collection(db, 'birthdayPlans'), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQuery);
      const plans: DBBirthdayPlan[] = [];
      querySnapshot.forEach((docSnap) => {
        plans.push(docSnap.data() as DBBirthdayPlan);
      });
      return plans;
    } catch (fallbackError) {
      if (isOfflineError(fallbackError)) {
        console.warn('Firestore offline during fallback query, loading from local cache for userId:', userId);
        try {
          const cachedPlansStr = localStorage.getItem('myday_birthday_plans');
          if (cachedPlansStr) {
            const cachedPlans = JSON.parse(cachedPlansStr);
            if (Array.isArray(cachedPlans)) {
              return cachedPlans.filter(p => p.userId === userId) as DBBirthdayPlan[];
            }
          }
        } catch (e) {
          console.warn('Failed to read plans from local cache during fallback:', e);
        }
        return [];
      }
      handleFirestoreError(fallbackError, OperationType.LIST, path);
      return [];
    }
  }
};

export const deleteBirthdayPlan = async (planId: string): Promise<void> => {
  const path = `birthdayPlans/${planId}`;
  
  // Update local cache
  try {
    const cachedPlansStr = localStorage.getItem('myday_birthday_plans');
    if (cachedPlansStr) {
      const cachedPlans = JSON.parse(cachedPlansStr);
      if (Array.isArray(cachedPlans)) {
        const filtered = cachedPlans.filter(p => p.id !== planId);
        localStorage.setItem('myday_birthday_plans', JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('Failed to delete plan from local cache:', e);
  }

  try {
    const docRef = doc(db, 'birthdayPlans', planId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline, deleted birthday plan from local cache only.');
      return;
    }
    console.warn(`Firestore delete failed for birthday plan ${planId}, proceeding with local deletion.`, error);
  }
};

// -----------------------------------------------------------------------------
// 3. Vendors Collection Services
// -----------------------------------------------------------------------------

export const getVendors = async (category?: string): Promise<DBVendor[]> => {
  const path = 'vendors';
  try {
    const vendorsCollection = collection(db, 'vendors');
    const q = category 
      ? query(vendorsCollection, where('category', '==', category))
      : vendorsCollection;
    const querySnapshot = await getDocs(q);
    const vendors: DBVendor[] = [];
    querySnapshot.forEach((docSnap) => {
      vendors.push({ ...docSnap.data(), id: docSnap.id } as DBVendor);
    });
    return vendors;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const addVendor = async (vendor: Omit<DBVendor, 'id'>): Promise<string> => {
  const path = 'vendors';
  try {
    const docRef = await addDoc(collection(db, 'vendors'), vendor);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateVendor = async (vendorId: string, updates: Partial<DBVendor>): Promise<void> => {
  const path = `vendors/${vendorId}`;
  try {
    const docRef = doc(db, 'vendors', vendorId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getVendorByEmail = async (email: string): Promise<DBVendor | null> => {
  const path = 'vendors';
  try {
    const q = query(collection(db, 'vendors'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as DBVendor;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
};

// Seeding standard high-quality vendors for MyDay
export const seedSampleVendors = async (sampleVendors: DBVendor[]): Promise<void> => {
  try {
    const existingVendors = await getVendors();
    if (existingVendors.length === 0) {
      console.log('No vendors found in Firestore. Seeding initial vendors...');
      for (const vendor of sampleVendors) {
        const { id, ...vendorData } = vendor;
        const targetId = id || doc(collection(db, 'vendors')).id;
        await setDoc(doc(db, 'vendors', targetId), vendorData);
      }
      console.log('Seeding sample vendors completed successfully.');
    }
  } catch (error) {
    console.error('Error seeding sample vendors:', error);
  }
};

// -----------------------------------------------------------------------------
// 4. Bookings Collection Services
// -----------------------------------------------------------------------------

export const createBooking = async (booking: Omit<DBBooking, 'id'>): Promise<string> => {
  const path = 'bookings';
  try {
    const docRef = await addDoc(collection(db, 'bookings'), booking);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getBookings = async (userId: string): Promise<DBBooking[]> => {
  const path = 'bookings';
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const bookings: DBBooking[] = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push({ ...docSnap.data(), id: docSnap.id } as DBBooking);
    });
    return bookings;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getBookingsForVendor = async (vendorId: string): Promise<DBBooking[]> => {
  const path = 'bookings';
  try {
    const q = query(collection(db, 'bookings'), where('vendorId', '==', vendorId));
    const querySnapshot = await getDocs(q);
    const bookings: DBBooking[] = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push({ ...docSnap.data(), id: docSnap.id } as DBBooking);
    });
    return bookings;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const updateBookingStatus = async (
  bookingId: string, 
  status: DBBooking['bookingStatus'],
  paymentStatus?: DBBooking['paymentStatus']
): Promise<void> => {
  const path = `bookings/${bookingId}`;
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const updateData: Partial<DBBooking> = { bookingStatus: status };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// -----------------------------------------------------------------------------
// 5. Notifications Collection Services
// -----------------------------------------------------------------------------

export const createNotification = async (notification: Omit<DBNotification, 'id'>): Promise<string> => {
  const path = 'notifications';
  // Check if guest or offline
  if (!notification.userId || notification.userId === 'guest') {
    const cachedStr = localStorage.getItem('myday_notifications_guest') || '[]';
    const cached = JSON.parse(cachedStr) as DBNotification[];
    const id = 'notif_' + Math.random().toString(36).substring(2, 11);
    const newNotif: DBNotification = { ...notification, id };
    cached.unshift(newNotif);
    localStorage.setItem('myday_notifications_guest', JSON.stringify(cached.slice(0, 50)));
    return id;
  }
  try {
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    // offline fallback
    const cachedStr = localStorage.getItem(`myday_notifications_${notification.userId}`) || '[]';
    const cached = JSON.parse(cachedStr) as DBNotification[];
    const id = 'notif_offline_' + Math.random().toString(36).substring(2, 11);
    const newNotif: DBNotification = { ...notification, id };
    cached.unshift(newNotif);
    localStorage.setItem(`myday_notifications_${notification.userId}`, JSON.stringify(cached.slice(0, 50)));
    
    console.warn('Firestore createNotification failed, saved to local cache:', error);
    return id;
  }
};

export const getNotifications = async (userId: string): Promise<DBNotification[]> => {
  const path = 'notifications';
  if (!userId || userId === 'guest') {
    const cachedStr = localStorage.getItem('myday_notifications_guest') || '[]';
    return JSON.parse(cachedStr) as DBNotification[];
  }
  try {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const notifications: DBNotification[] = [];
    querySnapshot.forEach((docSnap) => {
      notifications.push({ ...docSnap.data(), id: docSnap.id } as DBNotification);
    });
    // Sync to local cache
    localStorage.setItem(`myday_notifications_${userId}`, JSON.stringify(notifications));
    return notifications;
  } catch (error) {
    try {
      const fallbackQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQuery);
      const notifications: DBNotification[] = [];
      querySnapshot.forEach((docSnap) => {
        notifications.push({ ...docSnap.data(), id: docSnap.id } as DBNotification);
      });
      localStorage.setItem(`myday_notifications_${userId}`, JSON.stringify(notifications));
      return notifications;
    } catch (fallbackError) {
      console.warn(`Firestore getNotifications failed, returning local cache for ${userId}:`, fallbackError);
      const cachedStr = localStorage.getItem(`myday_notifications_${userId}`) || '[]';
      return JSON.parse(cachedStr) as DBNotification[];
    }
  }
};

export const markNotificationAsRead = async (notificationId: string, userId?: string): Promise<void> => {
  const path = `notifications/${notificationId}`;
  
  // Handle guest or offline notifications
  if (notificationId.startsWith('notif_') || !userId || userId === 'guest') {
    const key = (!userId || userId === 'guest') ? 'myday_notifications_guest' : `myday_notifications_${userId}`;
    const cachedStr = localStorage.getItem(key) || '[]';
    const cached = JSON.parse(cachedStr) as DBNotification[];
    const updated = cached.map(n => n.id === notificationId ? { ...n, read: true } : n);
    localStorage.setItem(key, JSON.stringify(updated));
    if (notificationId.startsWith('notif_offline_') || notificationId.startsWith('notif_')) {
      return;
    }
  }

  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.warn(`Firestore markNotificationAsRead failed for ${notificationId}, updated locally:`, error);
  }
};

export const deleteNotification = async (notificationId: string, userId?: string): Promise<void> => {
  const path = `notifications/${notificationId}`;
  
  // Handle guest or offline notifications
  if (notificationId.startsWith('notif_') || !userId || userId === 'guest') {
    const key = (!userId || userId === 'guest') ? 'myday_notifications_guest' : `myday_notifications_${userId}`;
    const cachedStr = localStorage.getItem(key) || '[]';
    const cached = JSON.parse(cachedStr) as DBNotification[];
    const updated = cached.filter(n => n.id !== notificationId);
    localStorage.setItem(key, JSON.stringify(updated));
    if (notificationId.startsWith('notif_offline_') || notificationId.startsWith('notif_')) {
      return;
    }
  }

  try {
    const docRef = doc(db, 'notifications', notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(`Firestore deleteNotification failed for ${notificationId}, updated locally:`, error);
  }
};

export const markAllNotificationsAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
  if (!userId || userId === 'guest') {
    const cachedStr = localStorage.getItem('myday_notifications_guest') || '[]';
    const cached = JSON.parse(cachedStr) as DBNotification[];
    const updated = cached.map(n => ({ ...n, read: true }));
    localStorage.setItem('myday_notifications_guest', JSON.stringify(updated));
    return;
  }

  // Update locally first
  const key = `myday_notifications_${userId}`;
  const cachedStr = localStorage.getItem(key) || '[]';
  const cached = JSON.parse(cachedStr) as DBNotification[];
  const updated = cached.map(n => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(updated));

  // Update in Firestore
  try {
    const promises = notificationIds
      .filter(id => !id.startsWith('notif_'))
      .map(async (id) => {
        const docRef = doc(db, 'notifications', id);
        return updateDoc(docRef, { read: true });
      });
    await Promise.all(promises);
  } catch (error) {
    console.warn(`Firestore markAllNotificationsAsRead failed, updated locally:`, error);
  }
};

// -----------------------------------------------------------------------------
// 6. System Activity Logs Collection Services
// -----------------------------------------------------------------------------

export interface DBSystemActivityLog {
  id?: string;
  type: 'login' | 'vendor_approved' | 'vendor_rejected' | 'user_delete' | 'user_role_update' | 'csv_export' | 'plan_created' | 'other';
  userEmail: string;
  userName: string;
  details: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export const logSystemActivity = async (activity: Omit<DBSystemActivityLog, 'id'>): Promise<string> => {
  const path = 'systemActivityLogs';
  try {
    const docRef = await addDoc(collection(db, 'systemActivityLogs'), activity);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getSystemActivityLogs = async (): Promise<DBSystemActivityLog[]> => {
  const path = 'systemActivityLogs';
  try {
    const q = query(
      collection(db, 'systemActivityLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    const logs: DBSystemActivityLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ ...docSnap.data(), id: docSnap.id } as DBSystemActivityLog);
    });
    return logs;
  } catch (error) {
    try {
      const fallbackQuery = query(collection(db, 'systemActivityLogs'));
      const querySnapshot = await getDocs(fallbackQuery);
      const logs: DBSystemActivityLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push({ ...docSnap.data(), id: docSnap.id } as DBSystemActivityLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return logs;
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, path);
      return [];
    }
  }
};

// -----------------------------------------------------------------------------
// 7. Booking Messages Collection Services (Real-time Customer-Vendor-Admin Chat)
// -----------------------------------------------------------------------------

export interface DBBookingMessage {
  id?: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor' | 'admin';
  text: string;
  timestamp: string;
}

export const listenToBookingMessages = (
  bookingId: string, 
  callback: (messages: DBBookingMessage[]) => void
) => {
  const q = query(
    collection(db, 'bookingMessages'),
    where('bookingId', '==', bookingId),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages: DBBookingMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ ...docSnap.data(), id: docSnap.id } as DBBookingMessage);
    });
    callback(messages);
  }, (error) => {
    console.warn("Error listening to booking messages (indexes may be compiling):", error);
    // Fallback to un-ordered query to avoid crashes if single-collection index is building
    const fallbackQ = query(
      collection(db, 'bookingMessages'),
      where('bookingId', '==', bookingId)
    );
    onSnapshot(fallbackQ, (fallbackSnapshot) => {
      const fallbackMsgs: DBBookingMessage[] = [];
      fallbackSnapshot.forEach((docSnap) => {
        fallbackMsgs.push({ ...docSnap.data(), id: docSnap.id } as DBBookingMessage);
      });
      fallbackMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(fallbackMsgs);
    });
  });
};

export const sendBookingMessage = async (message: Omit<DBBookingMessage, 'id'>): Promise<string> => {
  const path = 'bookingMessages';
  try {
    const docRef = await addDoc(collection(db, 'bookingMessages'), message);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

// -----------------------------------------------------------------------------
// 8. AI Budget Plans Collection Services
// -----------------------------------------------------------------------------

export interface DBBudgetPlan {
  id?: string;
  userId: string;
  totalBudget: number;
  eventType: string;
  guestCount: number;
  theme: string;
  location: string;
  explanation: string;
  allocatedCategories: {
    categoryName: string;
    percentage: number;
    cost: number;
    description: string;
  }[];
  warnings: string[];
  savingsSuggestions: string[];
  createdAt: string;
}

export const saveBudgetPlanToFirestore = async (budgetPlan: DBBudgetPlan): Promise<string> => {
  const path = 'budgets';
  const budgetId = budgetPlan.id || doc(collection(db, 'budgets')).id;
  const dataToSave = { ...budgetPlan, id: budgetId };
  
  // Cache locally first
  try {
    const cachedBudgetsStr = localStorage.getItem('myday_cached_budgets') || '[]';
    let cachedBudgets: DBBudgetPlan[] = JSON.parse(cachedBudgetsStr);
    if (!Array.isArray(cachedBudgets)) cachedBudgets = [];
    const existingIdx = cachedBudgets.findIndex(b => b.id === budgetId);
    if (existingIdx >= 0) {
      cachedBudgets[existingIdx] = dataToSave;
    } else {
      cachedBudgets.push(dataToSave);
    }
    localStorage.setItem('myday_cached_budgets', JSON.stringify(cachedBudgets));
  } catch (e) {
    console.warn('Failed to cache budget locally:', e);
  }

  try {
    const docRef = doc(db, 'budgets', budgetId);
    await setDoc(docRef, dataToSave);
    return budgetId;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, budget plan stored locally only.');
      return budgetId;
    }
    handleFirestoreError(error, OperationType.WRITE, `budgets/${budgetId}`);
    throw error;
  }
};

export const getBudgetPlansFromFirestore = async (userId: string): Promise<DBBudgetPlan[]> => {
  const path = 'budgets';
  try {
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const budgets: DBBudgetPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      budgets.push(docSnap.data() as DBBudgetPlan);
    });

    // Update cache
    try {
      localStorage.setItem('myday_cached_budgets', JSON.stringify(budgets));
    } catch (e) {
      console.warn('Failed to cache budgets list:', e);
    }

    return budgets;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, fetching budgets from local cache.');
      try {
        const cachedBudgetsStr = localStorage.getItem('myday_cached_budgets');
        if (cachedBudgetsStr) {
          return JSON.parse(cachedBudgetsStr) as DBBudgetPlan[];
        }
      } catch (e) {
        console.warn('Failed to read budgets from cache:', e);
      }
      return [];
    }

    // fallback query without sorting if index is building
    try {
      const fallbackQ = query(collection(db, 'budgets'), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      const budgets: DBBudgetPlan[] = [];
      querySnapshot.forEach((docSnap) => {
        budgets.push(docSnap.data() as DBBudgetPlan);
      });
      budgets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return budgets;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
};

export const deleteBudgetPlanFromFirestore = async (budgetId: string): Promise<void> => {
  const path = `budgets/${budgetId}`;
  
  // Cache delete
  try {
    const cachedBudgetsStr = localStorage.getItem('myday_cached_budgets');
    if (cachedBudgetsStr) {
      const cached = JSON.parse(cachedBudgetsStr);
      if (Array.isArray(cached)) {
        const filtered = cached.filter(b => b.id !== budgetId);
        localStorage.setItem('myday_cached_budgets', JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('Failed to update budgets list in cache during deletion:', e);
  }

  try {
    const docRef = doc(db, 'budgets', budgetId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, budget plan deleted from cache only.');
      return;
    }
    console.warn(`Firestore delete failed for budget plan ${budgetId}, proceeding with local deletion.`, error);
  }
};

// -----------------------------------------------------------------------------
// 9. AI Celebration Timeline Tasks Collection Services
// -----------------------------------------------------------------------------

export interface DBTimelineTask {
  id?: string;
  userId: string;
  birthdayPlanId: string; // "default" or specific plan ID
  title: string;
  description: string;
  dueDate: string; // ISO string
  phase: 'planning' | 'booking' | 'invitations' | 'final_touches' | 'day_of';
  completed: boolean;
  completedAt?: string | null;
  linkedType?: 'booking' | 'invitation' | 'budget' | 'none';
  linkedId?: string;
  reminderDaysBefore?: number;
  automaticReminderSent?: boolean;
  createdAt: string;
}

export const saveTimelineTaskToFirestore = async (task: DBTimelineTask): Promise<string> => {
  const taskId = task.id || doc(collection(db, 'timelineTasks')).id;
  const path = `timelineTasks/${taskId}`;
  const dataToSave = { ...task, id: taskId };

  // Cache locally first
  try {
    const cachedStr = localStorage.getItem('myday_cached_timeline_tasks') || '[]';
    let cached: DBTimelineTask[] = JSON.parse(cachedStr);
    if (!Array.isArray(cached)) cached = [];
    const idx = cached.findIndex(t => t.id === taskId);
    if (idx >= 0) {
      cached[idx] = dataToSave;
    } else {
      cached.push(dataToSave);
    }
    localStorage.setItem('myday_cached_timeline_tasks', JSON.stringify(cached));
  } catch (e) {
    console.warn('Failed to cache timeline task locally:', e);
  }

  try {
    const docRef = doc(db, 'timelineTasks', taskId);
    await setDoc(docRef, dataToSave);
    return taskId;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, timeline task saved locally only.');
      return taskId;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const getTimelineTasksFromFirestore = async (userId: string, birthdayPlanId?: string): Promise<DBTimelineTask[]> => {
  const path = 'timelineTasks';
  try {
    let q = query(
      collection(db, 'timelineTasks'),
      where('userId', '==', userId)
    );
    if (birthdayPlanId) {
      q = query(
        collection(db, 'timelineTasks'),
        where('userId', '==', userId),
        where('birthdayPlanId', '==', birthdayPlanId)
      );
    }
    const querySnapshot = await getDocs(q);
    const tasks: DBTimelineTask[] = [];
    querySnapshot.forEach((docSnap) => {
      tasks.push(docSnap.data() as DBTimelineTask);
    });

    // Update cache
    try {
      localStorage.setItem('myday_cached_timeline_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to cache timeline tasks:', e);
    }

    return tasks;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, loading timeline tasks from local cache.');
      try {
        const cachedStr = localStorage.getItem('myday_cached_timeline_tasks');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr) as DBTimelineTask[];
          if (birthdayPlanId) {
            return cached.filter(t => t.userId === userId && t.birthdayPlanId === birthdayPlanId);
          }
          return cached.filter(t => t.userId === userId);
        }
      } catch (e) {
        console.warn('Failed to read timeline tasks from cache:', e);
      }
      return [];
    }

    // fallback query without sorting if index is building
    try {
      const fallbackQ = query(collection(db, 'timelineTasks'), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQ);
      const tasks: DBTimelineTask[] = [];
      querySnapshot.forEach((docSnap) => {
        tasks.push(docSnap.data() as DBTimelineTask);
      });
      if (birthdayPlanId) {
        return tasks.filter(t => t.birthdayPlanId === birthdayPlanId);
      }
      return tasks;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  }
};

export const deleteTimelineTaskFromFirestore = async (taskId: string): Promise<void> => {
  const path = `timelineTasks/${taskId}`;
  
  // Cache delete
  try {
    const cachedStr = localStorage.getItem('myday_cached_timeline_tasks');
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Array.isArray(cached)) {
        const filtered = cached.filter(t => t.id !== taskId);
        localStorage.setItem('myday_cached_timeline_tasks', JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('Failed to delete timeline task from cache:', e);
  }

  try {
    const docRef = doc(db, 'timelineTasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore offline, timeline task deleted from cache only.');
      return;
    }
    console.warn(`Firestore delete failed for timeline task ${taskId}, proceeding with local deletion.`, error);
  }
};

