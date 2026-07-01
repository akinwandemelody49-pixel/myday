import { BirthdayPlan, Vendor, VendorApplication } from '../types';

// Standard Premium Vendors List for MyDay
export const SAMPLE_VENDORS: Vendor[] = [
  {
    id: 'venue-1',
    name: 'The Glass Pavilion Centre',
    category: 'venue',
    rating: 4.9,
    reviewsCount: 124,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    location: 'Ilorin, Kwara State',
    description: 'An architectural masterpiece featuring floor-to-ceiling glass walls, curated tropical gardens, and stunning illumination. Perfect for modern, elegant evening birthday soirées.',
    contactEmail: 'events@glasspavilion.com',
    contactPhone: '+234 803 123 4567'
  },
  {
    id: 'venue-2',
    name: 'Amberwood Palms Garden',
    category: 'venue',
    rating: 4.8,
    reviewsCount: 89,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'A gorgeous premium outdoor garden wrapped in high palm trees, showing manicured lawns, white floral layouts, and sparkling fairy lights perfect for luxury garden birthdays.',
    contactEmail: 'concierge@amberwood palms.com',
    contactPhone: '+234 805 765 4321'
  },
  {
    id: 'venue-3',
    name: 'Verve Grand Hall',
    category: 'venue',
    rating: 4.7,
    reviewsCount: 156,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1505232458627-539c97b4ca15?auto=format&fit=crop&q=80&w=800',
    location: 'Pipeline, Ilorin',
    description: 'A beautifully designed contemporary events hall featuring high timber beams, modern industrial aesthetics, and gorgeous warm ambient lighting designs.',
    contactEmail: 'bookings@vervegrand.com'
  },
  {
    id: 'catering-1',
    name: 'Epicurean African Cuisine',
    category: 'catering',
    rating: 4.9,
    reviewsCount: 112,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=800',
    location: 'Kwara State Metro',
    description: 'Fine-dining multi-course tasting menus highlighting upscale African gourmet delicacies, royal party Jollof rice, and custom culinary plated presentations with organic local ingredients.',
    contactEmail: 'chef@epicureanfood.com'
  },
  {
    id: 'catering-2',
    name: 'Harvest Chops & Platters',
    category: 'catering',
    rating: 4.7,
    reviewsCount: 74,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800',
    location: 'Ilorin Central',
    description: 'Bespoke grazing tables, gourmet small chops towers, artisanal suya platters, and premium hibiscus-zobo mocktails tailored to elevate your birthday experience.',
    contactEmail: 'hello@harvestchops.com'
  },
  {
    id: 'decor-1',
    name: 'Golden Hour Luxury Decor',
    category: 'decor',
    rating: 4.9,
    reviewsCount: 95,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    location: 'Design Quarter, Ilorin',
    description: 'Curated birthday balloon backdrops, majestic floral structures, premium tableware, and warm, golden-hour ambient custom lighting layouts.',
    contactEmail: 'design@goldenhourdecor.com'
  },
  {
    id: 'decor-2',
    name: 'Luxe Avant-Garde balloon & Florals',
    category: 'decor',
    rating: 4.8,
    reviewsCount: 53,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'Ultra-modern minimalist decorations. Think gorgeous organic balloon installations, glowing custom neon signs, and striking photo-booth background setups.',
    contactEmail: 'luxe@avantgardedecor.com'
  },
  {
    id: 'entertainment-1',
    name: 'Crystal Strings & Afro-Sax Ensemble',
    category: 'entertainment',
    rating: 5.0,
    reviewsCount: 42,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
    location: 'Ilorin City Center',
    description: 'A world-class live musical ensemble performing a beautiful fusion of classical strings, soulful saxophone solos, and traditional talking drum rhythms.',
    contactEmail: 'booking@crystalstrings.com'
  },
  {
    id: 'entertainment-2',
    name: 'Premium Afro-Jazz Band & DJ',
    category: 'entertainment',
    rating: 4.8,
    reviewsCount: 88,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    location: 'Kwara State Metro',
    description: 'A highly charismatic MC and high-energy professional Nigerian DJ delivering smooth live sax sets, upbeat Afrobeats, Amapiano, and nostalgic highlife classics.',
    contactEmail: 'info@premiumafrobeats.com'
  },
  {
    id: 'baking-1',
    name: 'Atelier de Sucre Custom Cakes',
    category: 'baking',
    rating: 4.9,
    reviewsCount: 165,
    priceRange: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
    location: 'GRA, Ilorin',
    description: 'Bespoke custom-crafted luxury Nigerian celebration cakes featuring intricate sugar flowers, velvet textures, and gold leaf accents. Exquisite flavors include Coconut Velvet and Salted Caramel.',
    contactEmail: 'cakes@atelierdesucre.com'
  },
  {
    id: 'baking-2',
    name: 'Minimalist Crumb Bakery',
    category: 'baking',
    rating: 4.7,
    reviewsCount: 62,
    priceRange: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    location: 'West End, Ilorin',
    description: 'Sophisticated modern birthday cakes, gorgeous naked buttercream styles, custom message toppers, and organic fresh flower garnishes.',
    contactEmail: 'hello@minimalistcrumb.com'
  },
  {
    id: 'photography-1',
    name: 'Vogue Lens African Portraits',
    category: 'photography',
    rating: 4.9,
    reviewsCount: 71,
    priceRange: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800',
    location: 'Kwara State Metro',
    description: 'Editorial-style birthday photography. Capturing real candid laughter, beautiful traditional attire, and premium high-fashion portraits to cherish forever.',
    contactEmail: 'studio@voguelens.com'
  }
];

// In-Memory & Local Storage persistence manager for Demo Mode
const STORAGE_KEY = 'myday_birthday_plans';

import { collection, query, where, getDocs, setDoc, doc, deleteDoc, getDocFromServer, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Validate Connection to Firestore as per the Firebase Integration Skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Firebase initialized and ready.");
    }
  }
}
testConnection();

// Fetch a single plan from Firestore by plan ID (used for shared invitations/summaries)
export const getFirestoreBirthdayPlan = async (planId: string): Promise<BirthdayPlan | null> => {
  try {
    const docRef = doc(db, 'birthday_plans', planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BirthdayPlan;
    }
    return null;
  } catch (e) {
    console.error('Error reading single plan from Firestore', e);
    return null;
  }
};

// Fetch plans from Firestore for the specific user
export const getFirestoreBirthdayPlans = async (userId: string): Promise<BirthdayPlan[]> => {
  try {
    const q = query(collection(db, 'birthday_plans'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const plans: BirthdayPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as BirthdayPlan);
    });
    return plans;
  } catch (e) {
    console.error('Error reading from Firestore', e);
    throw e;
  }
};

// Save a single plan to Firestore
export const savePlanToFirestore = async (plan: BirthdayPlan): Promise<void> => {
  try {
    const docRef = doc(db, 'birthday_plans', plan.id);
    await setDoc(docRef, plan);
    console.log(`Plan ${plan.id} saved to Firestore`);
  } catch (e) {
    console.error('Error saving to Firestore', e);
    throw e;
  }
};

// Delete a single plan from Firestore
export const deletePlanFromFirestore = async (planId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'birthday_plans', planId);
    await deleteDoc(docRef);
    console.log(`Plan ${planId} deleted from Firestore`);
  } catch (e) {
    console.error('Error deleting from Firestore', e);
    throw e;
  }
};

export const getLocalBirthdayPlans = (): BirthdayPlan[] => {
  try {
    const plansJson = localStorage.getItem(STORAGE_KEY);
    if (plansJson) {
      return JSON.parse(plansJson);
    }
  } catch (e) {
    console.error('Error reading local plans', e);
  }
  
  // Default Sample Plan if none exists
  const defaultPlan: BirthdayPlan = {
    id: 'plan-default',
    userId: 'user-demo',
    celebrantName: 'Melody Akinwande',
    age: 28,
    eventDate: '2026-07-15',
    budget: 5000,
    guestCount: 25,
    vibe: 'elegant',
    interests: ['Fine Dining', 'Live Jazz', 'Floral Installation', 'Sunset Portraits'],
    themeTitle: 'Amber & Glass Soirée',
    themeDescription: 'A sophisticated evening centered around glowing amber illumination, floral arrangements, and premium contemporary string arrangements.',
    status: 'planning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedVendors: {
      venue: 'venue-1',
      catering: 'catering-1',
      decor: 'decor-1',
      entertainment: 'entertainment-1',
      baking: 'baking-1',
    },
    aiSuggestedItinerary: [
      {
        id: 'it-1',
        time: '18:00',
        title: 'Arrival & Welcome Drinks',
        description: 'Guests arrive at The Glass Pavilion, greeted with bespoke elderflower champagne cocktails.',
        duration: '1 hour',
        location: 'West Terrace Garden',
        estimatedCost: 350
      },
      {
        id: 'it-2',
        time: '19:00',
        title: 'Chamber Pop Live Recital',
        description: 'Starlight Chamber Strings performs a special modern tribute while guests mingle and find their seats.',
        duration: '45 mins',
        location: 'Main Pavilion Hall',
        estimatedCost: 1200
      },
      {
        id: 'it-3',
        time: '20:00',
        title: 'Gastronomic Dinner Service',
        description: 'A 4-course organic tasting menu curated by Epicurean Table, highlighting seasonal lavender and gold ingredients.',
        duration: '2 hours',
        location: 'Dining Veranda',
        estimatedCost: 2500
      },
      {
        id: 'it-4',
        time: '22:00',
        title: 'Toast & Cake Cutting Ceremony',
        description: 'Cutting the custom atelier cake with champagne toast, accompanied by background acoustic standards.',
        duration: '1 hour',
        location: 'Main Pavilion Hall',
        estimatedCost: 600
      }
    ]
  };

  return [defaultPlan];
};

export const saveBirthdayPlans = (plans: BirthdayPlan[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans locally', e);
  }
};

// Save a vendor application to Firestore
export const saveVendorApplicationToFirestore = async (application: VendorApplication): Promise<void> => {
  try {
    const docRef = doc(db, 'vendorApplications', application.applicationId);
    await setDoc(docRef, application);
    console.log(`Vendor Application ${application.applicationId} saved to Firestore`);
  } catch (e) {
    console.error('Error saving vendor application to Firestore', e);
    throw e;
  }
};

// Fetch vendor applications from Firestore
export const getVendorApplicationsFromFirestore = async (): Promise<VendorApplication[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'vendorApplications'));
    const apps: VendorApplication[] = [];
    querySnapshot.forEach((docSnap) => {
      apps.push(docSnap.data() as VendorApplication);
    });
    return apps;
  } catch (e) {
    console.error('Error fetching vendor applications from Firestore', e);
    return [];
  }
};

