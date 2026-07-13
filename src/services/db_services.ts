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
  limit
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
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
    handleFirestoreError(error, OperationType.DELETE, path);
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
  try {
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getNotifications = async (userId: string): Promise<DBNotification[]> => {
  const path = 'notifications';
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
    return notifications;
  } catch (error) {
    try {
      const fallbackQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(fallbackQuery);
      const notifications: DBNotification[] = [];
      querySnapshot.forEach((docSnap) => {
        notifications.push({ ...docSnap.data(), id: docSnap.id } as DBNotification);
      });
      return notifications;
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, path);
      return [];
    }
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const path = `notifications/${notificationId}`;
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
